import type {
  ScoreCategory,
  ScoreDirection,
  ScoreRule,
  ScoreRuleReviewType,
  ScoreRuleTriggerType,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type DefaultScoreRule = {
  code: string;
  name: string;
  version: number;
  category: ScoreCategory;
  direction: ScoreDirection;
  points: number;
  reviewType: ScoreRuleReviewType;
  triggerType: ScoreRuleTriggerType;
  description?: string;
  config?: Record<string, unknown>;
};

export const DEFAULT_SCORE_RULES: DefaultScoreRule[] = [
  {
    code: "BASE_TRIP",
    name: "基础带队积分",
    version: 1,
    category: "BASE_TRIP",
    direction: "ADD",
    points: 0,
    reviewType: "AUTO",
    triggerType: "TRIP_COMPLETED",
    description: "完成实际带队后自动计算：1 + 实际带队天数 * 3",
    config: { formula: "1 + actualWorkDays * 3", perTripPoints: 1, perDayPoints: 3 },
  },
  {
    code: "MOMENTS_POST",
    name: "朋友圈分享",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 3,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "出团后朋友圈分享，每团最多 1 次",
  },
  {
    code: "XHS_POST",
    name: "小红书笔记",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "出团后小红书笔记，每团最多 1 次",
  },
  {
    code: "REPURCHASE",
    name: "老队员复购",
    version: 1,
    category: "REPURCHASE",
    direction: "ADD",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "成功邀请老队员复购，5 分/人",
  },
  {
    code: "REFERRAL_REGULAR",
    name: "推荐新队长转正",
    version: 1,
    category: "REFERRAL",
    direction: "ADD",
    points: 10,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "推荐新队长成功转正，年度最高 30 分",
    config: { yearlyCap: 30 },
  },
  {
    code: "MENTORSHIP",
    name: "带教新队长",
    version: 1,
    category: "MENTORSHIP",
    direction: "ADD",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "公司指定带教并完成复盘，5 分/人",
  },
  {
    code: "MATERIAL_LEVEL_2",
    name: "二档摄影补贴",
    version: 1,
    category: "MATERIAL",
    direction: "ADD",
    points: 3,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
  },
  {
    code: "MATERIAL_LEVEL_1",
    name: "一档摄影补贴",
    version: 1,
    category: "MATERIAL",
    direction: "ADD",
    points: 5,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
  },
  {
    code: "MAY_DAY_ATTENDANCE",
    name: "五一实际出队",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 15,
    reviewType: "MANUAL_RECORD",
    triggerType: "HOLIDAY_ATTENDANCE_APPROVED",
  },
  {
    code: "NATIONAL_DAY_ATTENDANCE",
    name: "国庆实际出队",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 15,
    reviewType: "MANUAL_RECORD",
    triggerType: "HOLIDAY_ATTENDANCE_APPROVED",
  },
  {
    code: "DOUBLE_HOLIDAY_BONUS",
    name: "双节额外奖励",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 10,
    reviewType: "AUTO",
    triggerType: "HOLIDAY_ATTENDANCE_APPROVED",
  },
  {
    code: "HOLIDAY_RECOGNIZED",
    name: "节假日未安排但认定",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 10,
    reviewType: "MANUAL_REVIEW",
    triggerType: "HOLIDAY_ATTENDANCE_APPROVED",
  },
  {
    code: "SMOKING",
    name: "带团期间抽烟",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 20,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "带团期间在队员面前或公共场景抽烟",
  },
  {
    code: "UNIFORM_MISSING",
    name: "集合日未穿队服",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "SLIPPER",
    name: "穿拖鞋等形象不符",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "LATE",
    name: "队长集合迟到",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 20,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "WAITING_OVER_10_MIN",
    name: "组织不当等待超过10分钟",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 10,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "MISSING_EQUIPMENT",
    name: "未带基础物资",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "IGNORE_MEMBERS",
    name: "队长扎堆忽视队员",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 10,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "VALID_COMPLAINT",
    name: "有效投诉",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 15,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "SERIOUS_COMPLAINT",
    name: "严重有效投诉",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    config: { disqualifyBonus: true },
  },
  {
    code: "SAFETY_MISSING_NOTICE",
    name: "安全告知缺失",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "SAFETY_KEY_ACTION_MISSING",
    name: "关键安全动作缺失",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "INSURANCE_REPORT_DELAY",
    name: "出险报备延误",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "REDLINE",
    name: "红线行为",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 0,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "积分清零并取消奖金资格",
    config: { clearPoints: true, disqualifyBonus: true },
  },
  {
    code: "FAKE_BEHAVIOR",
    name: "虚假行为",
    version: 1,
    category: "VIOLATION",
    direction: "DEDUCT",
    points: 0,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "积分清零并取消奖金资格",
    config: { clearPoints: true, disqualifyBonus: true },
  },
];

export async function getActiveScoreRule({
  code,
  occurredAt,
}: {
  code: string;
  occurredAt: Date;
}) {
  return prisma.scoreRule.findFirst({
    where: {
      code,
      isActive: true,
      effectiveFrom: {
        lte: occurredAt,
      },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: occurredAt } }],
    },
    orderBy: [{ version: "desc" }, { effectiveFrom: "desc" }],
  });
}

export function buildRuleSnapshot(rule: ScoreRule) {
  return {
    id: rule.id,
    code: rule.code,
    name: rule.name,
    version: rule.version,
    category: rule.category,
    direction: rule.direction,
    points: rule.points,
    reviewType: rule.reviewType,
    triggerType: rule.triggerType,
    isActive: rule.isActive,
    effectiveFrom: rule.effectiveFrom.toISOString(),
    effectiveTo: rule.effectiveTo?.toISOString() ?? null,
    description: rule.description,
    configJson: rule.configJson,
  };
}

export async function seedDefaultScoreRules() {
  const effectiveFrom = new Date("2026-01-01T00:00:00+08:00");

  for (const rule of DEFAULT_SCORE_RULES) {
    await prisma.scoreRule.upsert({
      where: {
        code_version: {
          code: rule.code,
          version: rule.version,
        },
      },
      update: {
        name: rule.name,
        category: rule.category,
        direction: rule.direction,
        points: rule.points,
        reviewType: rule.reviewType,
        triggerType: rule.triggerType,
        isActive: true,
        effectiveFrom,
        effectiveTo: null,
        description: rule.description,
        configJson: rule.config ? JSON.stringify(rule.config) : null,
      },
      create: {
        code: rule.code,
        name: rule.name,
        version: rule.version,
        category: rule.category,
        direction: rule.direction,
        points: rule.points,
        reviewType: rule.reviewType,
        triggerType: rule.triggerType,
        isActive: true,
        effectiveFrom,
        description: rule.description,
        configJson: rule.config ? JSON.stringify(rule.config) : null,
      },
    });
  }

  return DEFAULT_SCORE_RULES.length;
}

export const ensureDefaultScoreRules = seedDefaultScoreRules;
