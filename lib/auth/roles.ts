import type { UserRole } from "@prisma/client";

export const LEADER_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
];

export const TRIP_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "PRODUCT_MANAGER",
];

export const TRIP_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
];
