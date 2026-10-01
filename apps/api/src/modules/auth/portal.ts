import { RoleCode } from "@salesflow/database";

export function resolvePortal(roleCodes: RoleCode[]) {
    if (roleCodes.includes(RoleCode.ADMIN) || roleCodes.includes(RoleCode.SUPER_ADMIN)) {
        return {
            code: "ADMIN",
            path: "/admin",
        };
    }

    if (roleCodes.includes(RoleCode.RSM)) {
        return {
            code: "RSM",
            path: "/rsm",
        };
    }

    if (roleCodes.includes(RoleCode.GT_TSM) || roleCodes.includes(RoleCode.MT_TSM)) {
        return {
            code: "TSM",
            path: "/tsm",
        };
    }

    if (roleCodes.includes(RoleCode.MTSR)) {
        return {
            code: "MTSR",
            path: "/mtsr",
        };
    }

    if (roleCodes.includes(RoleCode.ASR)) {
        return {
            code: "ASR",
            path: "/asr",
        };
    }

    if (roleCodes.includes(RoleCode.DISTRIBUTOR)) {
        return { code: RoleCode.DISTRIBUTOR, path: "/distributor" };
    }

    if (roleCodes.includes(RoleCode.HORECA)) {
        return { code: RoleCode.HORECA, path: "/horeca" };
    }

    if (roleCodes.includes(RoleCode.SUPPORT)) {
        return { code: RoleCode.SUPPORT, path: "/support" };
    }

    throw new Error("No portal is assigned to this user.");
}