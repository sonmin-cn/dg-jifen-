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

export const SCORE_RECORD_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

export const SCORE_RECORD_VOID_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
];

export const SCORE_RANKING_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

export const BONUS_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

export const BONUS_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
];

export const DATA_CHECK_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

export const SCORE_RULE_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

export const SCORE_RULE_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
];

export const SCORE_ADJUSTMENT_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

export const SCORE_ADJUSTMENT_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
];

export const VIOLATION_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

export const VIOLATION_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
];
