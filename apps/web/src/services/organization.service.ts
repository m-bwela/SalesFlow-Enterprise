import { prisma } from "../../../../packages/database";
import type { AuthorizationScope } from "@/types/auth";

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

  return regions;
}