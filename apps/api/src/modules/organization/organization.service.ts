import { prisma } from "@salesflow/database";
import type { AuthorizationScope } from "../auth/scope.js";

export async function getOrganizationFilters(
  organizationId: string,
  scope: AuthorizationScope,
) {
  const regions = await prisma.region.findMany({
    where: {
      organizationId,
      isActive: true,

      ...(scope.global
        ? {}
        : scope.regionIds.length > 0
          ? {
              id: {
                in: scope.regionIds,
              },
            }
          : scope.territoryIds.length > 0
            ? {
                territories: {
                  some: {
                    id: {
                      in: scope.territoryIds,
                    },
                  },
                },
              }
            : {}),
    },

    orderBy: {
      name: "asc",
    },

    select: {
      id: true,
      name: true,
      code: true,

      territories: {
        where: {
          isActive: true,

          ...(scope.global
            ? {}
            : scope.regionIds.length > 0
              ? {}
              : scope.territoryIds.length > 0
                ? {
                    id: {
                      in: scope.territoryIds,
                    },
                  }
                : {}),
        },

        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
          code: true,

          distributors: {
            where: {
              isActive: true,

              ...(scope.global
                ? {}
                : scope.distributorIds.length > 0
                  ? {
                      id: {
                        in: scope.distributorIds,
                      },
                    }
                  : {}),
            },

            orderBy: {
              name: "asc",
            },

            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  const asrs = await prisma.membershipRole.findMany({
    where: {
      isActive: true,

      startsAt: {
        lte: new Date(),
      },

      OR: [
        {
          endsAt: null,
        },
        {
          endsAt: {
            gt: new Date(),
          },
        },
      ],

      role: {
        code: "ASR",
      },

      membership: {
        isActive: true,
        organizationId,
        user: {
          status: "ACTIVE",
        },
      },

      ...(scope.global
        ? {}
        : scope.distributorIds.length > 0
          ? {
              distributorId: {
                in: scope.distributorIds,
              },
            }
          : scope.territoryIds.length > 0
            ? {
                territoryId: {
                  in: scope.territoryIds,
                },
              }
            : scope.regionIds.length > 0
              ? {
                  regionId: {
                    in: scope.regionIds,
                  },
                }
              : {
                  id: {
                    in: [],
                  },
                }),
    },

    orderBy: {
      membership: {
        user: {
          displayName: "asc",
        },
      },
    },

    select: {
      id: true,
      distributorId: true,
      territoryId: true,
      regionId: true,

      membership: {
        select: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return {
    regions,
    asrs: asrs.map((membershipRole) => ({
      id: membershipRole.membership.user.id,
      name: membershipRole.membership.user.displayName,
      email: membershipRole.membership.user.email,
      regionId: membershipRole.regionId,
      territoryId: membershipRole.territoryId,
      distributorId: membershipRole.distributorId,
    })),
  };
}