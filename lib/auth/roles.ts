import type { UserRole } from "@prisma/client";

export const LEADER_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
];
