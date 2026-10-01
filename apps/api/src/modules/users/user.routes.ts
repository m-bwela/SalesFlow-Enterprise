import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import type { UserStatus } from "@prisma/client";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import { AppError } from "../../errors/app-error.js";
import {
  changeUserStatus,
  checkoutAllUsers,
  createDepartment,
  createManagedUser,
  getIdentityDocument,
  getUserManagementOverview,
  unlockAllUsers,
  unlockUser,
  updateManagedUser,
  updateAsrShift,
} from "./user.service.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    if (["image/jpeg", "image/png", "image/pdf"].includes(file.mimetype)) callback(null, true);
    else callback(new AppError("INVALID_ID_IMAGE", 400, "ID images must be JPEG, PNG, or PDF files."));
  },
});

const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  surname: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(6).max(32),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  newDepartment: z.string().trim().max(80).optional(),
  roleLabel: z.enum(["Admin", "Regional Sales Manager", "Territory Sales Manager", "Distributor", "Field Sales Agent", "Mtsr", "Horeca", "Support", "Super Admin"]),
  transportType: z.enum(["Company car", "Personal car", "Motorcycle", "Bicycle", "Walking", "None"]),
  homeRegion: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  streetName: z.string().trim().max(180).optional(),
  blockNumber: z.string().trim().max(80).optional(),
  password: z.string().min(8).max(128).regex(/^[A-Z]/, "Password must start with a capital letter."),
});

const updateUserSchema = createUserSchema.omit({
  password: true,
  newDepartment: true,
  departmentId: true,
}).extend({
  departmentId: z.string().uuid(),
});

const statusSchema = z.object({ status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED", "ARCHIVED"]) });
const departmentSchema = z.object({ name: z.string().trim().min(2).max(80) });
const shiftSchema = z.object({
  closeStart: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  closeEnd: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  reopenAt: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
});
const userIdSchema = z.string().uuid();

function getOrganizationId(res: import("express").Response) {
  const organizationId = res.locals.membership?.organizationId;
  if (!organizationId) throw new AppError("ORGANIZATION_REQUIRED", 403, "An active organization membership is required.");
  return organizationId;
}

function getUserId(res: import("express").Response) {
  const userId = res.locals.user?.id;
  if (!userId) throw new AppError("UNAUTHENTICATED", 401, "Authentication required.");
  return userId;
}

function getUploadedFiles(files: unknown) {
  return (files ?? {}) as Record<string, Array<{ mimetype: string; buffer: Buffer }>>;
}

function isValidImageSignature(file: { mimetype: string; buffer: Buffer }) {
  if (file.mimetype === "image/png") return file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === "image/jpeg") return file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  return false;
}

router.use(authenticate);

router.get("/", requirePermission("users.view"), async (_req, res, next) => {
  try {
    const data = await getUserManagementOverview(getOrganizationId(res));
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/",
  requirePermission("users.create"),
  upload.fields([
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const input = createUserSchema.parse(req.body);
      const files = getUploadedFiles(req.files);
      const nationalIdFront = files.nationalIdFront?.[0];
      const nationalIdBack = files.nationalIdBack?.[0];
      if (!nationalIdFront) throw new AppError("ID_FRONT_REQUIRED", 400, "Upload the front of the national ID.");
      for (const file of [nationalIdFront, nationalIdBack]) {
        if (file && !isValidImageSignature(file)) throw new AppError("INVALID_ID_IMAGE", 400, "The uploaded file is not a valid JPEG or PNG image.");
      }

      const user = await createManagedUser({
        ...input,
        homeRegion: input.homeRegion ?? "",
        city: input.city ?? "",
        streetName: input.streetName ?? "",
        blockNumber: input.blockNumber ?? "",
        nationalIdFront,
        nationalIdBack,
      }, getOrganizationId(res));
      return res.status(201).json({ data: user });
    } catch (error) {
      return next(error);
    }
  },
);

router.post("/departments", requirePermission("users.create"), async (req, res, next) => {
  try {
    const { name } = departmentSchema.parse(req.body);
    const department = await createDepartment(getOrganizationId(res), name);
    return res.status(201).json({ data: department });
  } catch (error) {
    return next(error);
  }
});

router.put("/asr-shift", requirePermission("system.manage"), async (req, res, next) => {
  try {
    const input = shiftSchema.parse(req.body);
    const setting = await updateAsrShift(getOrganizationId(res), getUserId(res), input);
    return res.json({ data: setting });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:userId/status", requirePermission("users.update"), async (req, res, next) => {
  try {
    const userId = userIdSchema.parse(req.params.userId);
    const { status } = statusSchema.parse(req.body);
    const result = await changeUserStatus(userId, getOrganizationId(res), status as UserStatus);
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
});

router.post("/:userId/unlock", requirePermission("users.update"), async (req, res, next) => {
  try {
    const result = await unlockUser(userIdSchema.parse(req.params.userId), getOrganizationId(res));
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
});

router.post("/unlock-all", requirePermission("users.update"), async (_req, res, next) => {
  try {
    const result = await unlockAllUsers(getOrganizationId(res));
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/:userId",
  requirePermission("users.update"),
  upload.fields([
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const userId = userIdSchema.parse(req.params.userId);
      const input = updateUserSchema.parse(req.body);
      const files = getUploadedFiles(req.files);
      const nationalIdFront = files.nationalIdFront?.[0];
      const nationalIdBack = files.nationalIdBack?.[0];
      for (const file of [nationalIdFront, nationalIdBack]) {
        if (file && !isValidImageSignature(file)) throw new AppError("INVALID_ID_IMAGE", 400, "The uploaded file is not a valid JPEG or PNG image.");
      }

      const user = await updateManagedUser(
        userId,
        getOrganizationId(res),
        {
          ...input,
          homeRegion: input.homeRegion ?? "",
          city: input.city ?? "",
          streetName: input.streetName ?? "",
          blockNumber: input.blockNumber ?? "",
          nationalIdFront,
          nationalIdBack,
        },
      );
      return res.json({ data: user });
    } catch (error) {
      return next(error);
    }
  },
);

router.post("/checkout-all", requirePermission("users.update"), async (_req, res, next) => {
  try {
    const result = await checkoutAllUsers(getOrganizationId(res), undefined, getUserId(res));
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
});

router.post("/:userId/checkout", requirePermission("users.update"), async (req, res, next) => {
  try {
    const userId = userIdSchema.parse(req.params.userId);
    const organizationId = getOrganizationId(res);
    const result = await checkoutAllUsers(organizationId, userId);
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
});

router.get("/:userId/identity/:side", requirePermission("users.view"), async (req, res, next) => {
  try {
    const userId = userIdSchema.parse(req.params.userId);
    const side = z.enum(["front", "back"]).parse(req.params.side);
    const path = await getIdentityDocument(userId, getOrganizationId(res), side);
    const bytes = await readFile(path);
    res.type(path.endsWith(".png") ? "png" : "jpg").setHeader("Cache-Control", "private, no-store");
    return res.send(bytes);
  } catch (error) {
    return next(error);
  }
});

export default router;