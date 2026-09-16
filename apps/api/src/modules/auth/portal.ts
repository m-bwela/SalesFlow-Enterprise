import { RoleCode } from "@salesflow/database";

export function resolvePortal(roleCodes: RoleCode[]) {
    if (roleCodes.includes(RoleCode.ADMIN)) {
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

    throw new Error("No portal is assigned to this user.");
}