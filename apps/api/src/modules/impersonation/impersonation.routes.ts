import { Router } from "express";
import { z } from "zod";
import { prisma } from "@salesflow/database";
import { AppError } from "../../errors/app-error.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../auth/auth.cookies.js";
import { hashSessionToken } from "../auth/session.js";
import { sessionService } from "../auth/session.service.js";

const router = Router();
const ADMIN_COOKIE = "salesflow_admin_session";
const IMPERSONATION_MS = 30 * 60 * 1000;
// Use whatever your unlock route uses for now. Switch to a dedicated "users.impersonate" permission later.
const IMPERSONATE_PERMISSION = "users.update";

const isSuperAdmin = async (userId: string, organizationId: string) =>
    (await prisma.membershipRole.count({
        where: { isActive: true, role: { code: "SUPER_ADMIN" }, membership: { userId, organizationId, isActive: true } },
    })) > 0;

// Admin starts viewing as a user
router.post("/:id/start", authenticate, requirePermission(IMPERSONATE_PERMISSION), async (req, res, next) => {
    try {
        const membership = res.locals.membership, admin = res.locals.user;
        if (!membership || !admin) throw new AppError("FORBIDDEN", 403, "No active organization membership found.");
        if (res.locals.impersonatedById) throw new AppError("ALREADY_IMPERSONATING", 403, "Exit the current session first.");

        const raw = req.params.id;
        const id = z.string().uuid().parse(Array.isArray(raw) ? raw[0] : raw);
        if (id === admin.id) throw new AppError("BAD_REQUEST", 400, "You can't view as yourself.");

        const adminToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
        if (!adminToken) throw new AppError("UNAUTHENTICATED", 401, "Authentication required");

        const target = await prisma.user.findFirst({
            where: { id, memberships: { some: { organizationId: membership.organizationId, isActive: true } } },
            select: { id: true, displayName: true, status: true },
        });
        if (!target) throw new AppError("USER_NOT_FOUND", 404, "User not found.");
        if (target.status !== "ACTIVE") throw new AppError("USER_INACTIVE", 400, "Only active users can be viewed as.");

        const [targetIsSuper, adminIsSuper] = await Promise.all([
            isSuperAdmin(target.id, membership.organizationId), isSuperAdmin(admin.id, membership.organizationId),
        ]);
        if (targetIsSuper && !adminIsSuper) throw new AppError("FORBIDDEN", 403, "Only a Super Admin can view as a Super Admin.");

        const { token } = await sessionService.createImpersonation(target.id, admin.id, IMPERSONATION_MS);
        await prisma.auditLog.create({
            data: { organizationId: membership.organizationId, actorId: admin.id, action: "USER_IMPERSONATION_START", resourceType: "User", resourceId: target.id, requestId: res.locals.requestId },
        });

        // Keep the admin's own session aside so Exit can restore it. Both cookies live for 30 minutes.
        res.cookie(ADMIN_COOKIE, adminToken, { ...sessionCookieOptions, maxAge: IMPERSONATION_MS });
        res.cookie(SESSION_COOKIE_NAME, token, { ...sessionCookieOptions, maxAge: IMPERSONATION_MS });
        res.json({ data: { userId: target.id, displayName: target.displayName } });
    } catch (error) { next(error); }
});

// Admin stops viewing as the user. Only authenticate here, because the target may lack admin permissions.
router.post("/exit", authenticate, async (req, res, next) => {
    try {
        const adminId = res.locals.impersonatedById as string | null;
        if (!adminId) throw new AppError("BAD_REQUEST", 400, "You are not viewing as another user.");

        const adminToken = req.cookies?.[ADMIN_COOKIE] as string | undefined;
        const [adminSession, adminMembership] = await Promise.all([
            adminToken ? prisma.session.findUnique({ where: { tokenHash: hashSessionToken(adminToken) } }) : Promise.resolve(null),
            prisma.membership.findFirst({ where: { userId: adminId, isActive: true }, select: { organizationId: true } }),
        ]);

        await sessionService.revoke(res.locals.session.id);
        await prisma.auditLog.create({
            data: { organizationId: adminMembership?.organizationId ?? null, actorId: adminId, action: "USER_IMPERSONATION_END", resourceType: "User", resourceId: res.locals.user.id, requestId: res.locals.requestId },
        });

        res.clearCookie(ADMIN_COOKIE, sessionCookieOptions);
        const restorable = Boolean(adminToken && adminSession && adminSession.userId === adminId && !adminSession.revokedAt && adminSession.expiresAt > new Date());
        if (restorable && adminToken && adminSession) {
            res.cookie(SESSION_COOKIE_NAME, adminToken, { ...sessionCookieOptions, maxAge: adminSession.expiresAt.getTime() - Date.now() });
        } else {
            res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);   // the admin has to sign in again
        }
        res.json({ data: { restored: restorable } });
    } catch (error) { next(error); }
});

// Tells the banner whether the current session is an impersonation
router.get("/status", authenticate, async (_req, res, next) => {
    try {
        const adminId = res.locals.impersonatedById as string | null;
        if (!adminId) return res.json({ data: { impersonating: false } });
        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { displayName: true } });
        res.json({ data: { impersonating: true, userName: res.locals.user.displayName, adminName: admin?.displayName ?? "Admin", expiresAt: res.locals.session.expiresAt } });
    } catch (error) { next(error); }
});

export default router;