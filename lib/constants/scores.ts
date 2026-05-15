import type {
  ScoreCategory,
  ScoreDirection,
  ScoreRecordStatus,
} from "@prisma/client";

export const SCORE_CATEGORY_LABELS: Record<ScoreCategory, string> = {
  BASE_TRIP: "基础带队",
  HOLIDAY: "节假日",
  SOCIAL: "社媒发布",
  REPURCHASE: "复购",
  REFERRAL: "推荐",
  MENTORSHIP: "带教",
  MATERIAL: "素材",
  VIOLATION: "违规",
  COMPLAINT: "投诉",
  SAFETY: "安全",
  REDLINE: "红线",
  MANUAL: "手工",
};

export const SCORE_DIRECTION_LABELS: Record<ScoreDirection, string> = {
  ADD: "加分",
  DEDUCT: "扣分",
};

export const SCORE_RECORD_STATUS_LABELS: Record<ScoreRecordStatus, string> = {
  EFFECTIVE: "有效",
  VOIDED: "已作废",
};

export const SCORE_CATEGORY_OPTIONS = Object.keys(
  SCORE_CATEGORY_LABELS,
) as ScoreCategory[];

export const SCORE_DIRECTION_OPTIONS = Object.keys(
  SCORE_DIRECTION_LABELS,
) as ScoreDirection[];

export const SCORE_RECORD_STATUS_OPTIONS = Object.keys(
  SCORE_RECORD_STATUS_LABELS,
) as ScoreRecordStatus[];
