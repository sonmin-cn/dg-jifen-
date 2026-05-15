import type { ScoreApplicationStatus, ScoreApplicationType } from "@prisma/client";

export type ScoreApplicationConfig = {
  label: string;
  ruleCode: string;
  requireTrip: boolean;
  requireEvidence: boolean;
  evidenceLabel: string;
};

export const SCORE_APPLICATION_CONFIGS: Record<
  "MOMENTS_POST" | "XHS_POST" | "REPURCHASE",
  ScoreApplicationConfig
> = {
  MOMENTS_POST: {
    label: "朋友圈分享",
    ruleCode: "MOMENTS_POST",
    requireTrip: true,
    requireEvidence: true,
    evidenceLabel: "朋友圈截图或说明",
  },
  XHS_POST: {
    label: "小红书笔记",
    ruleCode: "XHS_POST",
    requireTrip: true,
    requireEvidence: true,
    evidenceLabel: "小红书链接/截图说明",
  },
  REPURCHASE: {
    label: "老队员复购",
    ruleCode: "REPURCHASE",
    requireTrip: false,
    requireEvidence: true,
    evidenceLabel: "聊天记录、报名订单或复购说明",
  },
};

export const SCORE_APPLICATION_TYPE_OPTIONS = Object.keys(
  SCORE_APPLICATION_CONFIGS,
) as Array<keyof typeof SCORE_APPLICATION_CONFIGS>;

export const SCORE_APPLICATION_STATUS_LABELS: Record<
  ScoreApplicationStatus,
  string
> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
  CANCELLED: "已取消",
  NEEDS_MORE_INFO: "需补充",
};

export const SCORE_APPLICATION_STATUS_OPTIONS = Object.keys(
  SCORE_APPLICATION_STATUS_LABELS,
) as ScoreApplicationStatus[];

export function isSupportedApplicationType(
  value: unknown,
): value is keyof typeof SCORE_APPLICATION_CONFIGS {
  return (
    typeof value === "string" &&
    SCORE_APPLICATION_TYPE_OPTIONS.includes(
      value as keyof typeof SCORE_APPLICATION_CONFIGS,
    )
  );
}

export function getApplicationTypeLabel(type: ScoreApplicationType) {
  return isSupportedApplicationType(type)
    ? SCORE_APPLICATION_CONFIGS[type].label
    : type;
}

export function mapApplicationTypeToRuleCode(type: ScoreApplicationType) {
  if (!isSupportedApplicationType(type)) {
    return null;
  }

  return SCORE_APPLICATION_CONFIGS[type].ruleCode;
}
