import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import type { ScoreYearStatus } from "@prisma/client";

export const SCORE_YEAR_STATUS_LABELS: Record<ScoreYearStatus, string> = {
  NOT_STARTED: "未开始",
  ACTIVE: "启用中",
  SEALED: "已封存",
  SETTLED: "已结算",
};

export const SCORE_YEAR_STATUS_OPTIONS: ScoreYearStatus[] = [
  "NOT_STARTED",
  "ACTIVE",
  "SEALED",
  "SETTLED",
];

export function formatScoreYearDate(value: Date | null | undefined) {
  if (!value) return "-";
  return formatDateCN(value);
}
