import type { AuthorizationScope } from "./scope";

export function distributorScopeFilter(scope: AuthorizationScope) {
    if (scope.global) {
        return {};
    }

    return {
        id: {
            in: scope.distributorIds,
        }
    };
}