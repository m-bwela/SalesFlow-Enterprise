import type { Membership, MembershipRole, User } from "@prisma/client";

import type { AuthorizationScope } from "../modules/auth/scope";

export interface AuthContext {
    user: User;
    membership: Membership;
    roles: MembershipRole[];
    authorizationScope: AuthorizationScope;
}