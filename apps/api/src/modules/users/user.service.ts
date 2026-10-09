import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "@salesflow/database";
import type { Prisma, RoleCode, ScopeType, UserStatus } from "@prisma/client";
import { AppError } from "../../errors/app-error.js";

const PRIVATE_ID_DIRECTORY = resolve(process.cwd(), "private-storage", "national-ids");
const ACTIVE_SESSION_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

const KENYA_REGIONS = ["Central Region", "Coast Region", "Eastern Region", "Nairobi Region", "North Eastern Region", "Nyanza Region", "Rift Valley Region", "Western Region"];
const COAST_TERRITORIES = ["North Coast", "South Coast", "West Coast"];
const UNASSIGNED_TERRITORY_CODE = "UNASSIGNED";

const toCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
const regionCode = (organizationId: string, name: string) => `${toCode(name)}-${organizationId.slice(0, 8)}`;
const unassignedRegionCode = (organizationId: string) => `UNASSIGNED-${organizationId.slice(0, 8)}`;

interface IdentityUpload {
	mimetype: string;
	buffer: Buffer;
}

const roleCodes: Record<string, RoleCode> = {
	"Admin": "ADMIN",
	"Regional Sales Manager": "RSM",
	"GT TSM": "GT_TSM",
	"MT TSM": "MT_TSM",
	"Distributor": "DISTRIBUTOR",
	"Field Sales Agent": "ASR",
	"Mtsr": "MTSR",
	"Horeca": "HORECA",
	"Support": "SUPPORT",
	"Super Admin": "SUPER_ADMIN",
};

function getEatDayStart(date: Date) {
	const eatDate = new Date(date.getTime() + EAT_OFFSET_MS);
	return new Date(Date.UTC(eatDate.getUTCFullYear(), eatDate.getUTCMonth(), eatDate.getUTCDate()) - EAT_OFFSET_MS);
}

function getEatWeekStart(date: Date) {
	const start = getEatDayStart(date);
	const eatDay = new Date(start.getTime() + EAT_OFFSET_MS).getUTCDay();
	start.setTime(start.getTime() - ((eatDay + 6) % 7) * 24 * 60 * 60 * 1000);
	return start;
}

function getDailySignupBuckets(users: { createdAt: Date }[], now: Date) {
	const start = new Date(getEatDayStart(now).getTime() - 29 * 24 * 60 * 60 * 1000);
	const buckets = Array.from({ length: 30 }, (_, index) => {
		const date = new Date(start);
		date.setUTCDate(date.getUTCDate() + index);
		return { date: new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 10), count: 0 };
	});

	for (const user of users) {
		const index = Math.floor((getEatDayStart(user.createdAt).getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
		if (index >= 0 && index < buckets.length) buckets[index].count += 1;
	}

	return buckets;
}

function getAuthRoleNames(roles: { name: string; code: string }[]) {
	return roles.map((role) => role.name || role.code);
}

async function ensureKenyaRegions(organizationId: string) {
	await prisma.region.createMany({
		data: KENYA_REGIONS.map((name) => ({ organizationId, name, code: regionCode(organizationId, name) })),
		skipDuplicates: true,
	});
	const coast = await prisma.region.findUnique({
		where: { organizationId_code: { organizationId, code: regionCode(organizationId, "Coast Region") } },
		select: { id: true },
	});
	if (coast) {
		await prisma.territory.createMany({
			data: COAST_TERRITORIES.map((name) => ({ regionId: coast.id, organizationId, name, code: toCode(name) })),
			skipDuplicates: true,
		});
	}
}

// Validates the chosen region/territory and returns the pair to store. A territory always implies its region.
async function resolveLocation(organizationId: string, regionId: string | undefined, territoryId: string | undefined) {
	if (territoryId) {
		const territory = await prisma.territory.findFirst({
			where: { id: territoryId, region: { organizationId, ...(regionId ? { id: regionId } : {}) } },
			select: { id: true, regionId: true },
		});
		if (!territory) throw new AppError("INVALID_TERRITORY", 400, "Choose a territory that belongs to the selected region.");
		return { regionId: territory.regionId, territoryId: territory.id };
	}
	if (regionId) {
		const region = await prisma.region.findFirst({ where: { id: regionId, organizationId }, select: { id: true } });
		if (!region) throw new AppError("INVALID_REGION", 400, "Choose a region in this organization.");
		return { regionId: region.id, territoryId: null };
	}
	return { regionId: null, territoryId: null };
}

// Which region/territory each role needs, and how wide its access scope is. Admins keep GLOBAL access; their location is informational.
function applyRoleLocation(roleCode: RoleCode, location: { regionId: string | null; territoryId: string | null }) {
	const requireRegion = () => {
		if (!location.regionId) throw new AppError("REGION_REQUIRED", 400, "Choose a region for this role.");
	};
	switch (roleCode) {
		case "ADMIN":
		case "SUPER_ADMIN":
			return { ...location, scopeType: "GLOBAL" as ScopeType };
		case "RSM":
			requireRegion();
			return { regionId: location.regionId, territoryId: null, scopeType: "REGION" as ScopeType };
		case "GT_TSM":
		case "MT_TSM":
		case "ASR":
		case "MTSR":
		case "HORECA":
			requireRegion();
			if (!location.territoryId) throw new AppError("TERRITORY_REQUIRED", 400, "Choose a territory for this role.");
			return { ...location, scopeType: "TERRITORY" as ScopeType };
		case "DISTRIBUTOR":
			requireRegion();
			return { ...location, scopeType: "GLOBAL" as ScopeType };
		default:
			return { regionId: null, territoryId: null, scopeType: "GLOBAL" as ScopeType };
	}
}

export { createTerritory } from "../territories/territories.service.js";

export async function getUserManagementOverview(organizationId: string) {
	const now = new Date();
	const todayStart = getEatDayStart(now);
	const weekStart = getEatWeekStart(now);
	const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);
	const monthStart = new Date(Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), 1) - EAT_OFFSET_MS);
	const signupStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
	await prisma.department.createMany({
		data: ["Administration", "IT", "Accounts", "Marketing", "Operations", "Sales", "Support"].map((name) => ({ organizationId, name })),
		skipDuplicates: true,
	});
	await ensureKenyaRegions(organizationId);
	const users = await prisma.user.findMany({
		where: { memberships: { some: { organizationId, isActive: true } } },
		orderBy: { createdAt: "desc" },
		take: 1000,
		select: {
			id: true,
			displayName: true,
			firstName: true,
			surname: true,
			email: true,
			phoneNumber: true,
			status: true,
			department: { select: { id: true, name: true } },
			transportType: true,
			homeRegion: true,
			city: true,
			streetName: true,
			blockNumber: true,
			emailVerifiedAt: true,
			nationalIdFrontPath: true,
			nationalIdBackPath: true,
			lockedUntil: true,
			createdAt: true,
			memberships: {
				where: { organizationId, isActive: true },
				select: {
					roles: {
						where: { isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
						select: { regionId: true, territoryId: true, role: { select: { code: true, name: true } } },
					},
				},
			},
		},
	});

	const userIds = users.map(({ id }) => id);
	const [onlineSessions, sessionActivity, loginAttemptsToday, loginAttemptsWeek, neverLoggedInUsers, loginEvents, signupUsers, departments, roles, shiftSetting, regions] = await Promise.all([
		userIds.length ? prisma.session.findMany({
			where: { userId: { in: userIds }, revokedAt: null, expiresAt: { gt: now }, lastSeenAt: { gte: new Date(now.getTime() - ACTIVE_SESSION_WINDOW_MS) }, user: { status: "ACTIVE" } },
			select: { userId: true },
			distinct: ["userId"],
		}) : Promise.resolve([]),
		userIds.length ? prisma.session.findMany({
			where: { userId: { in: userIds } },
			select: { userId: true, lastSeenAt: true, createdAt: true },
		}) : Promise.resolve([]),
		userIds.length ? prisma.loginAttempt.count({ where: { userId: { in: userIds }, successful: true, createdAt: { gte: todayStart } } }) : Promise.resolve(0),
		userIds.length ? prisma.loginAttempt.count({ where: { userId: { in: userIds }, successful: true, createdAt: { gte: weekStart } } }) : Promise.resolve(0),
		userIds.length ? prisma.user.count({ where: { id: { in: userIds }, sessions: { none: {} } } }) : Promise.resolve(0),
		userIds.length ? prisma.loginAttempt.findMany({
			where: { userId: { in: userIds }, createdAt: { gte: weekStart } },
			orderBy: { createdAt: "desc" },
			take: 10000,
			select: { userId: true, successful: true, createdAt: true },
		}) : Promise.resolve([]),
		prisma.user.findMany({
			where: { memberships: { some: { organizationId, isActive: true } }, createdAt: { gte: signupStart } },
			select: { createdAt: true },
		}),
		prisma.department.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
		prisma.role.findMany({ orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
		prisma.asrShiftSetting.upsert({
			where: { organizationId },
			update: {},
			create: { organizationId },
			select: { closeStart: true, closeEnd: true, reopenAt: true, updatedAt: true, updatedBy: { select: { displayName: true } } },
		}),
		prisma.region.findMany({
			where: { organizationId, NOT: { code: { startsWith: "UNASSIGNED" } } },
			orderBy: { name: "asc" },
			select: { id: true, name: true, territories: { where: { code: { not: UNASSIGNED_TERRITORY_CODE } }, orderBy: { name: "asc" }, select: { id: true, name: true } } },
		}),
	]);

	const onlineIds = new Set(onlineSessions.map(({ userId }) => userId));
	const lastSeenByUser = new Map<string, Date>();
	for (const session of sessionActivity) {
		const activityAt = session.lastSeenAt ?? session.createdAt;
		const previousActivity = lastSeenByUser.get(session.userId);
		if (!previousActivity || activityAt > previousActivity) {
			lastSeenByUser.set(session.userId, activityAt);
		}
	}
	const loginCounts = new Map<string, number>();
	for (const event of loginEvents) {
		if (event.successful && event.userId) loginCounts.set(event.userId, (loginCounts.get(event.userId) ?? 0) + 1);
	}
	const userRoles = new Map(users.map((user) => [user.id, user.memberships.flatMap((membership) => membership.roles).map(({ role }) => role)]));
	const roleCount = (predicate: (codes: string[]) => boolean) => users.filter((user) => predicate((userRoles.get(user.id) ?? []).map(({ code }) => code))).length;
	const activeCount = users.filter(({ status }) => status === "ACTIVE").length;
	const asrCodes = ["ASR"];
	const tsmCodes = ["GT_TSM", "MT_TSM"];
	const userLocations = new Map(users.map((user) => {
		const located = user.memberships.flatMap((membership) => membership.roles).find((membershipRole) => membershipRole.regionId);
		return [user.id, { regionId: located?.regionId ?? "", territoryId: located?.territoryId ?? "" }];
	}));
	const adminRsmCodes = ["ADMIN", "SUPER_ADMIN", "RSM"];
	const onlineNow = onlineIds.size;
	const neverLoggedIn = users.filter((user) => !loginCounts.has(user.id) && !loginAttemptsToday).length;
	const loginsTopUsers = [...loginCounts.entries()]
		.sort((left, right) => right[1] - left[1])
		.slice(0, 8)
		.map(([userId, count]) => ({
			userId,
			count,
			name: users.find(({ id }) => id === userId)?.displayName ?? "Unknown user",
		}));

	return {
		updatedAt: now.toISOString(),
		stats: {
			totalUsers: users.filter(({ status }) => status !== "ARCHIVED").length,
			activeUsers: activeCount,
			inactiveDisabled: users.filter(({ status }) => status === "DISABLED").length,
			onlineNow,
			newThisWeek: users.filter(({ createdAt }) => createdAt >= weekStart).length,
			newThisMonth: users.filter(({ createdAt }) => createdAt >= monthStart).length,
			loginsToday: loginAttemptsToday,
			neverLoggedIn: neverLoggedInUsers,
			asrs: roleCount((codes) => codes.some((code) => asrCodes.includes(code))),
			asrsWithTransport: users.filter((user) => (userRoles.get(user.id) ?? []).some(({ code }) => asrCodes.includes(code)) && Boolean(user.transportType && user.transportType.toLowerCase() !== "none")).length,
			tsms: roleCount((codes) => codes.some((code) => tsmCodes.includes(code))),
			distributors: roleCount((codes) => codes.includes("DISTRIBUTOR")),
			adminsAndRsms: roleCount((codes) => codes.some((code) => adminRsmCodes.includes(code))),
			loginsThisWeek: loginAttemptsWeek,
			suspended: users.filter(({ status }) => status === "SUSPENDED").length,
			incompleteProfiles: users.filter((user) => !user.firstName || !user.surname || !user.phoneNumber || !user.department || !user.transportType || !user.nationalIdFrontPath).length,
		},
		signups: getDailySignupBuckets(signupUsers, now),
		topActiveUsers: loginsTopUsers,
		onlineUserIds: [...onlineIds],
		users: users.map((user) => {
			const roles = userRoles.get(user.id) ?? [];
			return {
				id: user.id,
				name: user.displayName,
				email: user.email,
				emailVerified: Boolean(user.emailVerifiedAt),
				phone: user.phoneNumber,
				firstName: user.firstName ?? "",
				surname: user.surname ?? "",
				createdAt: user.createdAt.toISOString(),
				roles: getAuthRoleNames(roles),
				roleCodes: roles.map(({ code }) => code),
				department: user.department?.name ?? "",
				departmentId: user.department?.id ?? "",
				transportType: user.transportType ?? "",
				homeRegion: user.homeRegion ?? "",
				city: user.city ?? "",
				streetName: user.streetName ?? "",
				blockNumber: user.blockNumber ?? "",
				regionId: userLocations.get(user.id)?.regionId ?? "",
				territoryId: userLocations.get(user.id)?.territoryId ?? "",
				status: user.status,
				online: onlineIds.has(user.id),
				lastSeenAt: lastSeenByUser.get(user.id)?.toISOString() ?? null,
				appAccess: user.status === "ACTIVE" && !roles.some(({ code }) => ["ADMIN", "SUPER_ADMIN"].includes(code)),
				locked: Boolean(user.lockedUntil && user.lockedUntil > now),
				incomplete: !user.firstName || !user.surname || !user.phoneNumber || !user.department || !user.transportType || !user.nationalIdFrontPath,
				hasNationalIdFront: Boolean(user.nationalIdFrontPath),
				hasNationalIdBack: Boolean(user.nationalIdBackPath),
				loginsThisWeek: loginCounts.get(user.id) ?? 0,
			};
		}),
		departments,
		regions,
		roles: roles.map(({ id, code, name }) => ({ id, code, name })),
		loginAttempts: loginEvents.slice(0, 100).map((event) => ({
			userId: event.userId,
			name: event.userId ? users.find(({ id }) => id === event.userId)?.displayName ?? "Unknown user" : "Unregistered email",
			successful: event.successful,
			createdAt: event.createdAt.toISOString(),
		})),
		shift: {
			closeStart: shiftSetting.closeStart,
			closeEnd: shiftSetting.closeEnd,
			reopenAt: shiftSetting.reopenAt,
			updatedAt: shiftSetting.updatedAt.toISOString(),
			updatedBy: shiftSetting.updatedBy?.displayName ?? null,
		},
	};
}

export async function createManagedUser(input: {
	firstName: string;
	surname: string;
	email: string;
	phone: string;
	departmentId?: string;
	newDepartment?: string;
	roleLabel: string;
	transportType: string;
	homeRegion: string;
	city: string;
	streetName: string;
	blockNumber: string;
	password: string;
	regionId?: string;
	territoryId?: string;
	nationalIdFront?: IdentityUpload;
	nationalIdBack?: IdentityUpload;
}, organizationId: string) {
	const roleCode = roleCodes[input.roleLabel];
	if (!roleCode) throw new AppError("INVALID_ROLE", 400, "Choose a valid user role.");
	const location = await resolveLocation(organizationId, input.regionId || undefined, input.territoryId || undefined);
	const roleLocation = applyRoleLocation(roleCode, location);

	const email = input.email.trim().toLowerCase();
	const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
	if (existing) throw new AppError("EMAIL_EXISTS", 409, "A user with that email already exists.");

	let departmentId = input.departmentId;
	if (input.newDepartment?.trim()) {
		const department = await prisma.department.upsert({
			where: { organizationId_name: { organizationId, name: input.newDepartment.trim() } },
			update: {},
			create: { organizationId, name: input.newDepartment.trim() },
			select: { id: true },
		});
		departmentId = department.id;
	}
	if (!departmentId) throw new AppError("DEPARTMENT_REQUIRED", 400, "Choose or add a department.");
	const department = await prisma.department.findFirst({
		where: { id: departmentId, organizationId },
		select: { id: true },
	});
	if (!department) throw new AppError("INVALID_DEPARTMENT", 400, "Choose a department in this organization.");

	const role = await prisma.role.findUnique({ where: { code: roleCode }, select: { id: true } });
	if (!role) throw new AppError("ROLE_NOT_CONFIGURED", 409, "The selected role has not been seeded yet.");

	const storedPaths: string[] = [];
	const storeIdentityFile = async (file: IdentityUpload | undefined) => {
		if (!file) return null;
		const extension = file.mimetype === "image/png" ? ".png" : file.mimetype.endsWith("pdf") ? ".pdf" : ".jpg" ;
		const fileName = `${randomUUID()}${extension}`;
		await mkdir(PRIVATE_ID_DIRECTORY, { recursive: true });
		await writeFile(resolve(PRIVATE_ID_DIRECTORY, fileName), file.buffer, { flag: "wx", mode: 0o600 });
		const relativePath = `national-ids/${fileName}`;
		storedPaths.push(relativePath);
		return relativePath;
	};

	try {
		const [nationalIdFrontPath, nationalIdBackPath] = await Promise.all([
			storeIdentityFile(input.nationalIdFront),
			storeIdentityFile(input.nationalIdBack),
		]);
		const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
		const displayName = `${input.firstName.trim()} ${input.surname.trim()}`;

		const user = await prisma.$transaction(async (transaction) => {
			const createdUser = await transaction.user.create({
				data: {
					firstName: input.firstName.trim(),
					surname: input.surname.trim(),
					displayName,
					email,
					phoneNumber: input.phone.trim(),
					departmentId,
					transportType: input.transportType,
					homeRegion: input.homeRegion.trim() || null,
					city: input.city.trim() || null,
					streetName: input.streetName.trim() || null,
					blockNumber: input.blockNumber.trim() || null,
					nationalIdFrontPath,
					nationalIdBackPath,
					passwordHash,
					status: "PENDING",
				},
				select: { id: true, email: true, displayName: true },
			});
			const membership = await transaction.membership.create({
				data: { userId: createdUser.id, organizationId },
				select: { id: true },
			});
			await transaction.membershipRole.create({
				data: {
					membershipId: membership.id,
					roleId: role.id,
					scopeType: roleLocation.scopeType,
					regionId: roleLocation.regionId,
					territoryId: roleLocation.territoryId,
					isActive: true,
				},
			});
			return createdUser;
		});
		return user;
	} catch (error) {
		await Promise.all(storedPaths.map((path) => rm(resolve(PRIVATE_ID_DIRECTORY, "..", path), { force: true })));
		throw error;
	}
}

export async function updateManagedUser(userId: string, organizationId: string, input: {
	firstName: string;
	surname: string;
	email: string;
	phone: string;
	departmentId: string;
	roleLabel: string;
	transportType: string;
	homeRegion: string;
	city: string;
	streetName: string;
	blockNumber: string;
	regionId?: string;
	territoryId?: string;
	nationalIdFront?: IdentityUpload;
	nationalIdBack?: IdentityUpload;
}) {
	const roleCode = roleCodes[input.roleLabel];
	if (!roleCode) throw new AppError("INVALID_ROLE", 400, "Choose a valid user role.");
	const location = await resolveLocation(organizationId, input.regionId || undefined, input.territoryId || undefined);
	const roleLocation = applyRoleLocation(roleCode, location);

	const existingUser = await prisma.user.findFirst({
		where: { id: userId, memberships: { some: { organizationId, isActive: true } } },
		select: {
			id: true,
			status: true,
			nationalIdFrontPath: true,
			nationalIdBackPath: true,
			memberships: { where: { organizationId, isActive: true }, select: { id: true }, take: 1 },
		},
	});
	if (!existingUser) throw new AppError("USER_NOT_FOUND", 404, "User not found.");

	const email = input.email.trim().toLowerCase();
	const emailOwner = await prisma.user.findUnique({ where: { email }, select: { id: true } });
	if (emailOwner && emailOwner.id !== userId) throw new AppError("EMAIL_EXISTS", 409, "A user with that email already exists.");

	const department = await prisma.department.findFirst({
		where: { id: input.departmentId, organizationId },
		select: { id: true },
	});
	if (!department) throw new AppError("INVALID_DEPARTMENT", 400, "Choose a department in this organization.");

	const role = await prisma.role.findUnique({ where: { code: roleCode }, select: { id: true } });
	if (!role) throw new AppError("ROLE_NOT_CONFIGURED", 409, "The selected role has not been seeded yet.");

	const storedPaths: string[] = [];
	const saveReplacement = async (file: IdentityUpload | undefined) => {
		if (!file) return null;
		const extension = file.mimetype === "image/png" ? ".png" : file.mimetype.endsWith("pdf") ? ".pdf" : ".jpg";
		const fileName = `${randomUUID()}${extension}`;
		await mkdir(PRIVATE_ID_DIRECTORY, { recursive: true });
		await writeFile(resolve(PRIVATE_ID_DIRECTORY, fileName), file.buffer, { flag: "wx", mode: 0o600 });
		const filePath = `national-ids/${fileName}`;
		storedPaths.push(filePath);
		return filePath;
	};

	try {
		const [frontPath, backPath] = await Promise.all([
			saveReplacement(input.nationalIdFront),
			saveReplacement(input.nationalIdBack),
		]);
		const membershipId = existingUser.memberships[0].id;
		const updatedUser = await prisma.$transaction(async (transaction) => {
			const user = await transaction.user.update({
				where: { id: userId },
				data: {
					firstName: input.firstName.trim(),
					surname: input.surname.trim(),
					displayName: `${input.firstName.trim()} ${input.surname.trim()}`,
					email,
					phoneNumber: input.phone.trim(),
					departmentId: department.id,
					transportType: input.transportType,
					homeRegion: input.homeRegion.trim() || null,
					city: input.city.trim() || null,
					streetName: input.streetName.trim() || null,
					blockNumber: input.blockNumber.trim() || null,
					...(frontPath ? { nationalIdFrontPath: frontPath } : {}),
					...(backPath ? { nationalIdBackPath: backPath } : {}),
				},
				select: { id: true, displayName: true, email: true },
			});
			const previousDistributorRoles = await transaction.membershipRole.findMany({
				where: { membershipId, isActive: true, role: { code: "DISTRIBUTOR" }, distributorId: { not: null } },
				select: { distributorId: true },
			});
			await transaction.membershipRole.updateMany({
				where: { membershipId, isActive: true },
				data: { isActive: false, endsAt: new Date() },
			});
			await transaction.membershipRole.upsert({
				where: { membershipId_roleId: { membershipId, roleId: role.id } },
				update: { isActive: true, endsAt: null, startsAt: new Date(), scopeType: roleLocation.scopeType, regionId: roleLocation.regionId, territoryId: roleLocation.territoryId },
				create: { membershipId, roleId: role.id, scopeType: roleLocation.scopeType, regionId: roleLocation.regionId, territoryId: roleLocation.territoryId, isActive: true },
			});
			if (roleCode !== "DISTRIBUTOR") {
				const distributorIds = previousDistributorRoles.flatMap(({ distributorId }) => distributorId ? [distributorId] : []);
				if (distributorIds.length) await transaction.distributor.updateMany({ where: { id: { in: distributorIds } }, data: { isActive: false } });
			} else {
				await syncDistributorRecord(transaction, userId, organizationId, existingUser.status);
			}
			return user;
		});

		const replacedPaths = [
			frontPath ? existingUser.nationalIdFrontPath : null,
			backPath ? existingUser.nationalIdBackPath : null,
		].filter((path): path is string => Boolean(path));
		await Promise.all(replacedPaths.map((path) =>
			rm(resolve(PRIVATE_ID_DIRECTORY, "..", path), { force: true }).catch(() => undefined),
		));
		return updatedUser;
	} catch (error) {
		await Promise.all(storedPaths.map((path) => rm(resolve(PRIVATE_ID_DIRECTORY, "..", path), { force: true })));
		throw error;
	}
}

export async function getIdentityDocument(userId: string, organizationId: string, side: "front" | "back") {
	const user = await prisma.user.findFirst({
		where: { id: userId, memberships: { some: { organizationId, isActive: true } } },
		select: { nationalIdFrontPath: true, nationalIdBackPath: true },
	});
	const path = side === "front" ? user?.nationalIdFrontPath : user?.nationalIdBackPath;
	if (!path) throw new AppError("DOCUMENT_NOT_FOUND", 404, "Identity document not found.");
	return resolve(PRIVATE_ID_DIRECTORY, "..", path);
}

export async function changeUserStatus(userId: string, organizationId: string, status: UserStatus) {
	const user = await prisma.user.findFirst({ where: { id: userId, memberships: { some: { organizationId, isActive: true } } }, select: { id: true } });
	if (!user) throw new AppError("USER_NOT_FOUND", 404, "User not found.");
	return prisma.$transaction(async (transaction) => {
		const updatedUser = await transaction.user.update({ where: { id: userId }, data: { status }, select: { id: true, status: true } });
		if (status !== "ACTIVE") {
			const revokedAt = new Date();
			await transaction.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt, lastSeenAt: revokedAt } });
		}
		await syncDistributorRecord(transaction, userId, organizationId, status);
		return updatedUser;
	});
}

// Keeps the Distributor row (shown on the Distributors dashboard) in step with a user holding the DISTRIBUTOR role.
async function syncDistributorRecord(transaction: Prisma.TransactionClient, userId: string, organizationId: string, status: UserStatus) {
	const membershipRole = await transaction.membershipRole.findFirst({
		where: { isActive: true, role: { code: "DISTRIBUTOR" }, membership: { userId, organizationId, isActive: true } },
		select: { id: true, distributorId: true, regionId: true, territoryId: true, membership: { select: { user: { select: { displayName: true, phoneNumber: true } } } } },
	});
	if (!membershipRole) return;

	const isActive = status === "ACTIVE";
	const { user } = membershipRole.membership;
	if (membershipRole.distributorId) {
		const territoryId = membershipRole.regionId
			? await resolveDistributorTerritoryId(transaction, organizationId, membershipRole.regionId, membershipRole.territoryId)
			: undefined;
		await transaction.distributor.update({
			where: { id: membershipRole.distributorId },
			data: { isActive, name: user.displayName, phoneNumber: user.phoneNumber, ...(territoryId ? { territoryId } : {}) },
		});
		return;
	}
	if (!isActive) return;

	const territoryId = await resolveDistributorTerritoryId(transaction, organizationId, membershipRole.regionId, membershipRole.territoryId);
	const distributor = await transaction.distributor.create({
		data: {
			territoryId,
			name: user.displayName,
			code: `DST-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
			phoneNumber: user.phoneNumber,
			isActive: true,
		},
		select: { id: true },
	});
	await transaction.membershipRole.update({ where: { id: membershipRole.id }, data: { distributorId: distributor.id } });
}

// With no chosen territory, the distributor goes under an "Unassigned" territory of its region (or of a catch-all region).
async function resolveDistributorTerritoryId(transaction: Prisma.TransactionClient, organizationId: string, regionId: string | null, territoryId: string | null) {
	if (territoryId) return territoryId;
	const targetRegionId = regionId ?? (await transaction.region.upsert({
		where: { organizationId_code: { organizationId, code: unassignedRegionCode(organizationId) } },
		update: {},
		create: { organizationId, name: "Unassigned", code: unassignedRegionCode(organizationId) },
		select: { id: true },
	})).id;
	const territory = await transaction.territory.upsert({
		where: { regionId_code: { regionId: targetRegionId, code: UNASSIGNED_TERRITORY_CODE } },
		update: {},
		create: { regionId: targetRegionId, organizationId, name: "Unassigned", code: UNASSIGNED_TERRITORY_CODE },
		select: { id: true },
	});
	return territory.id;
}

export async function createDepartment(organizationId: string, name: string) {
	return prisma.department.upsert({
		where: { organizationId_name: { organizationId, name } },
		update: {},
		create: { organizationId, name },
		select: { id: true, name: true },
	});
}

export async function unlockUser(userId: string, organizationId: string) {
	const user = await prisma.user.findFirst({ where: { id: userId, memberships: { some: { organizationId, isActive: true } } }, select: { id: true } });
	if (!user) throw new AppError("USER_NOT_FOUND", 404, "User not found.");
	await prisma.user.update({ where: { id: userId }, data: { lockedUntil: null } });
	return { id: userId, unlocked: true };
}

export async function unlockAllUsers(organizationId: string) {
	const result = await prisma.user.updateMany({
		where: { memberships: { some: { organizationId, isActive: true } }, lockedUntil: { gt: new Date() } },
		data: { lockedUntil: null },
	});
	return { unlocked: result.count };
}

export async function checkoutAllUsers(organizationId: string, userId?: string, exceptUserId?: string) {
	const revokedAt = new Date();
	const result = await prisma.session.updateMany({
		where: {
			revokedAt: null,
			expiresAt: { gt: new Date() },
			user: {
				...(userId ? { id: userId } : exceptUserId ? { id: { not: exceptUserId } } : {}),
				memberships: { some: { organizationId, isActive: true } },
			},
		},
		data: { revokedAt, lastSeenAt: revokedAt },
	});
	return { loggedOut: result.count };
}

export async function updateAsrShift(organizationId: string, userId: string, input: { closeStart: string; closeEnd: string; reopenAt: string }) {
	return prisma.asrShiftSetting.upsert({
		where: { organizationId },
		update: { ...input, updatedById: userId },
		create: { organizationId, ...input, updatedById: userId },
		select: { closeStart: true, closeEnd: true, reopenAt: true, updatedAt: true, updatedBy: { select: { displayName: true } } },
	});
}

export async function recordLoginAttempt(email: string, userId: string | null, successful: boolean, ipAddress: string | undefined) {
	await prisma.loginAttempt.create({
		data: { email: email.trim().toLowerCase(), userId, successful, ipAddress: ipAddress ?? null },
	});
}

export async function registerFailedLogin(userId: string, email: string, ipAddress: string | undefined) {
	const now = new Date();
	await recordLoginAttempt(email, userId, false, ipAddress);
	const failedAttempts = await prisma.loginAttempt.count({
		where: { userId, successful: false, createdAt: { gte: new Date(now.getTime() - LOGIN_LOCK_WINDOW_MS) } },
	});
	if (failedAttempts >= MAX_FAILED_LOGINS) {
		await prisma.user.update({ where: { id: userId }, data: { lockedUntil: new Date(now.getTime() + LOGIN_LOCK_WINDOW_MS) } });
	}
}
