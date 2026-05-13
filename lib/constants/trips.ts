import type { TripLeaderRole, TripStatus } from "@prisma/client";

export const TRIP_STATUS_OPTIONS: TripStatus[] = [
  "PLANNED",
  "COMPLETED",
  "CANCELLED",
];

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: "计划中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export const TRIP_LEADER_ROLE_OPTIONS: TripLeaderRole[] = [
  "MAIN",
  "ASSISTANT",
  "OTHER",
];

export const TRIP_LEADER_ROLE_LABELS: Record<TripLeaderRole, string> = {
  MAIN: "主队",
  ASSISTANT: "副队",
  OTHER: "其他",
};
