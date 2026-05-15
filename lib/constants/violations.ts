import type { ScoreCategory, ViolationSeverity, ViolationType } from "@prisma/client";

export type ViolationRuleCode =
  | "SMOKING"
  | "UNIFORM_MISSING"
  | "SLIPPER"
  | "LATE"
  | "WAITING_OVER_10_MIN"
  | "MISSING_EQUIPMENT"
  | "IGNORE_MEMBERS"
  | "VALID_COMPLAINT"
  | "SERIOUS_COMPLAINT"
  | "SAFETY_MISSING_NOTICE"
  | "SAFETY_KEY_ACTION_MISSING"
  | "INSURANCE_REPORT_DELAY"
  | "REDLINE"
  | "FAKE_BEHAVIOR";

export type ViolationConfig = {
  ruleCode: ViolationRuleCode;
  label: string;
  category: ScoreCategory;
  type: ViolationType;
  defaultSeverity: ViolationSeverity;
  description: string;
  requiresTrip: boolean;
  requiresEvidence: boolean;
};

export const VIOLATION_CONFIGS: Record<ViolationRuleCode, ViolationConfig> = {
  SMOKING: {
    ruleCode: "SMOKING",
    label: "带团期间抽烟",
    category: "VIOLATION",
    type: "GENERAL",
    defaultSeverity: "SERIOUS",
    description: "带团期间在队员面前或公共场景抽烟。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  UNIFORM_MISSING: {
    ruleCode: "UNIFORM_MISSING",
    label: "集合日未穿队服",
    category: "VIOLATION",
    type: "GENERAL",
    defaultSeverity: "NORMAL",
    description: "集合日未按要求穿着队服。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  SLIPPER: {
    ruleCode: "SLIPPER",
    label: "穿拖鞋等形象不符",
    category: "VIOLATION",
    type: "GENERAL",
    defaultSeverity: "NORMAL",
    description: "集合日穿拖鞋等不符合形象要求。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  LATE: {
    ruleCode: "LATE",
    label: "队长集合迟到",
    category: "VIOLATION",
    type: "GENERAL",
    defaultSeverity: "SERIOUS",
    description: "队长未按约定集合时间到达。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  WAITING_OVER_10_MIN: {
    ruleCode: "WAITING_OVER_10_MIN",
    label: "队员等待超过10分钟",
    category: "VIOLATION",
    type: "GENERAL",
    defaultSeverity: "NORMAL",
    description: "组织不当导致队员等待超过10分钟。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  MISSING_EQUIPMENT: {
    ruleCode: "MISSING_EQUIPMENT",
    label: "未带基础物资",
    category: "VIOLATION",
    type: "GENERAL",
    defaultSeverity: "NORMAL",
    description: "未携带带队所需基础物资。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  IGNORE_MEMBERS: {
    ruleCode: "IGNORE_MEMBERS",
    label: "队长扎堆忽视队员",
    category: "VIOLATION",
    type: "GENERAL",
    defaultSeverity: "NORMAL",
    description: "队长扎堆聊天或行动，未充分照顾队员。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  VALID_COMPLAINT: {
    ruleCode: "VALID_COMPLAINT",
    label: "有效投诉",
    category: "COMPLAINT",
    type: "COMPLAINT",
    defaultSeverity: "SERIOUS",
    description: "经核实成立的队员投诉。",
    requiresTrip: false,
    requiresEvidence: true,
  },
  SERIOUS_COMPLAINT: {
    ruleCode: "SERIOUS_COMPLAINT",
    label: "严重有效投诉",
    category: "COMPLAINT",
    type: "COMPLAINT",
    defaultSeverity: "CRITICAL",
    description: "情节严重且经核实成立的投诉。",
    requiresTrip: false,
    requiresEvidence: true,
  },
  SAFETY_MISSING_NOTICE: {
    ruleCode: "SAFETY_MISSING_NOTICE",
    label: "未完成安全告知或未留证",
    category: "SAFETY",
    type: "SAFETY",
    defaultSeverity: "CRITICAL",
    description: "未按要求完成安全告知或未保留证据。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  SAFETY_KEY_ACTION_MISSING: {
    ruleCode: "SAFETY_KEY_ACTION_MISSING",
    label: "未执行关键安全动作",
    category: "SAFETY",
    type: "SAFETY",
    defaultSeverity: "CRITICAL",
    description: "未执行路线关键安全动作。",
    requiresTrip: true,
    requiresEvidence: true,
  },
  INSURANCE_REPORT_DELAY: {
    ruleCode: "INSURANCE_REPORT_DELAY",
    label: "出险后未及时报备",
    category: "SAFETY",
    type: "SAFETY",
    defaultSeverity: "CRITICAL",
    description: "出险后未按要求及时报备。",
    requiresTrip: false,
    requiresEvidence: true,
  },
  REDLINE: {
    ruleCode: "REDLINE",
    label: "红线行为",
    category: "REDLINE",
    type: "REDLINE",
    defaultSeverity: "CRITICAL",
    description: "红线行为，本阶段只记录事件和0分记录。",
    requiresTrip: false,
    requiresEvidence: true,
  },
  FAKE_BEHAVIOR: {
    ruleCode: "FAKE_BEHAVIOR",
    label: "虚假行为",
    category: "REDLINE",
    type: "FAKE_BEHAVIOR",
    defaultSeverity: "CRITICAL",
    description: "虚假行为，本阶段只记录事件和0分记录。",
    requiresTrip: false,
    requiresEvidence: true,
  },
};

export const VIOLATION_RULE_OPTIONS = Object.keys(
  VIOLATION_CONFIGS,
) as ViolationRuleCode[];

export const VIOLATION_STATUS_LABELS = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  EFFECTIVE: "已生效",
  REVOKED: "已撤销",
} as const;

export const VIOLATION_SEVERITY_LABELS: Record<ViolationSeverity, string> = {
  MINOR: "轻微",
  NORMAL: "一般",
  SERIOUS: "严重",
  CRITICAL: "关键",
};

export function isSupportedViolationRuleCode(
  value: unknown,
): value is ViolationRuleCode {
  return (
    typeof value === "string" &&
    VIOLATION_RULE_OPTIONS.includes(value as ViolationRuleCode)
  );
}

export function getViolationRuleLabel(ruleCode: string | null | undefined) {
  return isSupportedViolationRuleCode(ruleCode) ? VIOLATION_CONFIGS[ruleCode].label : ruleCode || "-";
}
