import type { LeaderStatus } from "@prisma/client";

export const LEADER_STATUS_OPTIONS: LeaderStatus[] = [
  "INTERN",
  "REGULAR",
  "SUSPENDED",
  "LEFT",
];

export const LEADER_LEVEL_OPTIONS = ["流星", "彗星", "恒星", "星云", "银河"];

export const LEADER_STATUS_LABELS: Record<LeaderStatus, string> = {
  INTERN: "实习",
  REGULAR: "正式",
  SUSPENDED: "暂停",
  LEFT: "离职",
};
