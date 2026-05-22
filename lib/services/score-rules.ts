import type {
  Prisma,
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

export type AdminScoreRuleParams = {
  keyword?: string;
  category?: ScoreCategory;
  direction?: ScoreDirection;
  isActive?: "true" | "false";
};

export type ScoreRuleInput = {
  code?: unknown;
  name?: unknown;
  version?: unknown;
  category?: unknown;
  direction?: unknown;
  points?: unknown;
  reviewType?: unknown;
  triggerType?: unknown;
  isActive?: unknown;
  effectiveFrom?: unknown;
  effectiveTo?: unknown;
  description?: unknown;
  configJson?: unknown;
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
    description: "完成实际带队后自动计算：1分/团 + 实际带队天数 * 1分/天",
    config: {
      formula: "perTripPoints + actualWorkDays * perDayPoints",
      perTripPoints: 1,
      perDayPoints: 1,
      roundActualWorkDays: "CEIL_TO_DAY",
    },
  },
  {
    code: "HOLIDAY_MAYDAY_CONTRIBUTION",
    name: "五一出勤贡献",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 15,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
    description: "五一满足公司排班要求后的后台确认贡献积分。",
    config: {
      holiday: "MAYDAY",
      points: 15,
      grantMode: "ADMIN_CONFIRM",
      requireScheduleCooperation: true,
      notAutoBySingleTrip: true,
      allowLeaderApplication: false,
      requireTrip: false,
    },
  },
  {
    code: "HOLIDAY_NATIONAL_DAY_CONTRIBUTION",
    name: "国庆出勤贡献",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 15,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
    description: "国庆满足公司排班要求后的后台确认贡献积分。",
    config: {
      holiday: "NATIONAL_DAY",
      points: 15,
      grantMode: "ADMIN_CONFIRM",
      requireScheduleCooperation: true,
      notAutoBySingleTrip: true,
      allowLeaderApplication: false,
      requireTrip: false,
    },
  },
  {
    code: "HOLIDAY_BOTH_BONUS",
    name: "五一国庆双节额外贡献",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 10,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
    description: "五一和国庆均满足贡献认定后的额外积分。",
    config: {
      requiresBothHolidaysSatisfied: true,
      includeCompanyNotArrangedButConfirmed: true,
      allowLeaderApplication: false,
      requireTrip: false,
    },
  },
  {
    code: "HOLIDAY_AVAILABLE_NOT_ARRANGED",
    name: "节假日可出勤但公司未安排认定",
    version: 1,
    category: "HOLIDAY",
    direction: "ADD",
    points: 10,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
    description: "队长节假日可出勤且配合排班，但公司未安排时的后台认定积分。",
    config: {
      grantMode: "ADMIN_CONFIRM",
      requiresSignupAvailable: true,
      requiresNoPickingTrips: true,
      canCountTowardBothHolidayBonus: true,
      allowLeaderApplication: false,
      requireTrip: false,
    },
  },
  {
    code: "MOMENTS_TRIP_SHARE",
    name: "朋友圈带队分享",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 3,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "群像照片 + 本次带队/路线相关文字，保留24小时，截图体现发布时间。",
    config: {
      allowLeaderApplication: true,
      requireTrip: true,
      perTripLimit: 1,
      annualCategoryCap: 80,
      requiresGroupPhoto: true,
      requiresTripRelatedText: true,
      requiresPublishTimeScreenshot: true,
      keepHours: 24,
    },
  },
  {
    code: "MOMENTS_DAILY_PROMO",
    name: "朋友圈日常分享 / 推广",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 1,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "转发招募、活动推文、队长故事、路线推荐、品牌宣传等。",
    config: {
      allowLeaderApplication: true,
      requireTrip: false,
      annualCategoryCap: 80,
      pureRepostAllowed: true,
      requiresPublishTimeScreenshot: true,
    },
  },
  {
    code: "XHS_SIMPLE_POST",
    name: "小红书简单分享",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 3,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "配图 + 行走20岁标签，公开可见，提交链接和截图。",
    config: {
      allowLeaderApplication: true,
      requireTrip: false,
      perTripLimit: 1,
      annualCategoryCap: 80,
      requiresPublicLink: true,
      requiresImage: true,
      requiresBrandTag: true,
      exclusiveWith: ["XHS_QUALITY_POST"],
    },
  },
  {
    code: "XHS_QUALITY_POST",
    name: "小红书要求版分享",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "带队心得或路线分享，正文不少于100字，公开可见。",
    config: {
      allowLeaderApplication: true,
      requireTrip: false,
      perTripLimit: 1,
      annualCategoryCap: 80,
      requiresPublicLink: true,
      minWords: 100,
      exclusiveWith: ["XHS_SIMPLE_POST"],
    },
  },
  {
    code: "DOUYIN_VIDEO_HEARTS",
    name: "抖音传播",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 0,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "每10个小红心5分，单条最高30分，以提交时截图为准。",
    config: {
      allowLeaderApplication: true,
      requireTrip: false,
      pointsPerUnit: 5,
      unitHearts: 10,
      maxPointsPerPost: 30,
      annualCategoryCap: 80,
      heartCountBased: true,
      heartCountSnapshotTiming: "SUBMISSION",
    },
  },
  {
    code: "VIDEO_ACCOUNT_HEARTS",
    name: "视频号传播",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 0,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "每10个小红心5分，单条最高30分，以提交时截图为准。",
    config: {
      allowLeaderApplication: true,
      requireTrip: false,
      pointsPerUnit: 5,
      unitHearts: 10,
      maxPointsPerPost: 30,
      annualCategoryCap: 80,
      heartCountBased: true,
      heartCountSnapshotTiming: "SUBMISSION",
    },
  },
  {
    code: "REPURCHASE_COMPLETED",
    name: "老队员复购",
    version: 1,
    category: "REPURCHASE",
    direction: "ADD",
    points: 5,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "老队员完成复购出行，5分/人/次。",
    config: {
      allowLeaderApplication: true,
      requireTrip: false,
      pointsPerPerson: 5,
      allowRepeatSameMember: true,
      oneOrderOneLeader: true,
      evidenceRequired: ["chatScreenshot", "completedTripVerification"],
    },
  },
  {
    code: "REFERRAL_NEW_LEADER",
    name: "推荐新队长",
    version: 1,
    category: "REFERRAL",
    direction: "ADD",
    points: 10,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
    description: "被推荐人通过培训成为实习队长、完成首次出队并最终转正后给分。",
    config: {
      allowLeaderApplication: false,
      requireTrip: false,
      annualCap: 30,
      grantWhen: "REFERRED_LEADER_BECOMES_REGULAR",
    },
  },
  {
    code: "MENTOR_NEW_LEADER",
    name: "带教新人",
    version: 1,
    category: "MENTORSHIP",
    direction: "ADD",
    points: 10,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
    description: "新人完成跟团/出团、双方复盘并最终转正后给分。",
    config: {
      allowLeaderApplication: false,
      requireTrip: true,
      grantWhen: "NEW_LEADER_BECOMES_REGULAR",
      evidenceRequired: [
        "mentorFeedback",
        "newLeaderReview",
        "tripCompleted",
        "regularConfirmation",
      ],
    },
  },
  {
    code: "POST_TRIP_FEEDBACK",
    name: "结团填写反馈",
    version: 1,
    category: "MANUAL",
    direction: "ADD",
    points: 1,
    reviewType: "MANUAL_RECORD",
    triggerType: "MANUAL",
    description: "结团后48小时内提交有效反馈。",
    config: {
      allowLeaderApplication: false,
      requireTrip: true,
      deadlineHoursAfterTripEnd: 48,
      requiredSections: ["routeIssues", "memberFeedback", "leaderCollaboration"],
    },
  },
  {
    code: "POST_TRIP_ROUTE_PROMO",
    name: "队长结团总结推广",
    version: 1,
    category: "SOCIAL",
    direction: "ADD",
    points: 2,
    reviewType: "MANUAL_REVIEW",
    triggerType: "SCORE_APPLICATION_APPROVED",
    description: "结团后推广行走20岁的其他路线，每团最多1次，可与传播加分重复。",
    config: {
      allowLeaderApplication: true,
      requireTrip: true,
      perTripLimit: 1,
      canStackWithPromotionPoints: true,
      purpose: "PROMOTE_OTHER_ROUTES",
    },
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
    category: "COMPLAINT",
    direction: "DEDUCT",
    points: 15,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "经后台核实成立的服务、组织、沟通、照顾队员等问题投诉。",
    config: {
      disqualifyBonusWhenAnnualCountGte: 2,
      appealDeadlineWorkdays: 3,
    },
  },
  {
    code: "SERIOUS_COMPLAINT",
    name: "严重投诉",
    version: 1,
    category: "COMPLAINT",
    direction: "DEDUCT",
    points: 0,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "同团3名及以上有效投诉同一队长，或单个重大事件。",
    config: {
      clearAnnualPoints: true,
      clearPoints: true,
      disqualifyBonus: true,
      definition: "同团3名及以上有效投诉同一队长，或单个重大事件",
      appealDeadlineWorkdays: 3,
    },
  },
  {
    code: "SAFETY_VIOLATION",
    name: "安全违规",
    version: 1,
    category: "SAFETY",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "未做中高风险安全告知、未录视频留证、未提醒救生衣、未及时保险报备或擅自组织高风险活动。",
    config: {
      disqualifyBonusWhenAnnualCountGte: 2,
      appealDeadlineWorkdays: 3,
    },
  },
  {
    code: "SAFETY_MISSING_NOTICE",
    name: "安全告知缺失",
    version: 1,
    category: "SAFETY",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "SAFETY_KEY_ACTION_MISSING",
    name: "关键安全动作缺失",
    version: 1,
    category: "SAFETY",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "INSURANCE_REPORT_DELAY",
    name: "出险报备延误",
    version: 1,
    category: "SAFETY",
    direction: "DEDUCT",
    points: 30,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
  },
  {
    code: "REDLINE",
    name: "红线行为",
    version: 1,
    category: "REDLINE",
    direction: "DEDUCT",
    points: 0,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "积分清零并取消奖金资格",
    config: {
      clearAnnualPoints: true,
      clearPoints: true,
      disqualifyBonus: true,
      followOriginalPolicy: true,
      appealDeadlineWorkdays: 3,
    },
  },
  {
    code: "FAKE_BEHAVIOR",
    name: "虚假行为",
    version: 1,
    category: "REDLINE",
    direction: "DEDUCT",
    points: 0,
    reviewType: "MANUAL_REVIEW",
    triggerType: "VIOLATION_CONFIRMED",
    description: "积分清零并取消奖金资格",
    config: {
      clearAnnualPoints: true,
      clearPoints: true,
      disqualifyBonus: true,
      appealDeadlineWorkdays: 3,
    },
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

export async function getAdminScoreRules(params: AdminScoreRuleParams) {
  return prisma.scoreRule.findMany({
    where: buildAdminScoreRuleWhere(params),
    orderBy: [{ code: "asc" }, { version: "desc" }],
  });
}

export async function createScoreRule(operatorUserId: string, input: ScoreRuleInput) {
  const validation = await validateScoreRuleInput(input);

  if (!validation.ok) return validation;

  const duplicate = await prisma.scoreRule.findUnique({
    where: {
      code_version: {
        code: validation.data.code,
        version: validation.data.version,
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    return { ok: false as const, status: 400, message: "同一 code + version 的规则已存在" };
  }

  const rule = await prisma.$transaction(async (tx) => {
    const created = await tx.scoreRule.create({ data: validation.data });
    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_RULE_CREATED",
        targetType: "ScoreRule",
        targetId: created.id,
        afterJson: JSON.stringify(created),
      },
    });
    return created;
  });

  return { ok: true as const, rule };
}

export async function updateScoreRule(
  id: string,
  operatorUserId: string,
  input: ScoreRuleInput,
) {
  const existing = await prisma.scoreRule.findUnique({ where: { id } });

  if (!existing) {
    return { ok: false as const, status: 404, message: "积分规则不存在" };
  }

  const validation = await validateScoreRuleInput(input);

  if (!validation.ok) return validation;

  const duplicate = await prisma.scoreRule.findFirst({
    where: {
      code: validation.data.code,
      version: validation.data.version,
      id: { not: id },
    },
    select: { id: true },
  });

  if (duplicate) {
    return { ok: false as const, status: 400, message: "同一 code + version 的规则已存在" };
  }

  const rule = await prisma.$transaction(async (tx) => {
    const updated = await tx.scoreRule.update({
      where: { id },
      data: validation.data,
    });
    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_RULE_UPDATED",
        targetType: "ScoreRule",
        targetId: id,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(updated),
      },
    });
    return updated;
  });

  return { ok: true as const, rule };
}

export async function setScoreRuleActive(
  id: string,
  operatorUserId: string,
  isActive: boolean,
) {
  const existing = await prisma.scoreRule.findUnique({ where: { id } });

  if (!existing) {
    return { ok: false as const, status: 404, message: "积分规则不存在" };
  }

  const rule = await prisma.$transaction(async (tx) => {
    const updated = await tx.scoreRule.update({
      where: { id },
      data: { isActive },
    });
    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: isActive ? "SCORE_RULE_ACTIVATED" : "SCORE_RULE_DEACTIVATED",
        targetType: "ScoreRule",
        targetId: id,
        beforeJson: JSON.stringify({ isActive: existing.isActive }),
        afterJson: JSON.stringify({ isActive: updated.isActive }),
      },
    });
    return updated;
  });

  return { ok: true as const, rule };
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

function buildAdminScoreRuleWhere(params: AdminScoreRuleParams) {
  const where: Prisma.ScoreRuleWhereInput = {};

  if (params.category) where.category = params.category;
  if (params.direction) where.direction = params.direction;
  if (params.isActive === "true") where.isActive = true;
  if (params.isActive === "false") where.isActive = false;
  if (params.keyword) {
    where.OR = [
      { code: { contains: params.keyword } },
      { name: { contains: params.keyword } },
      { description: { contains: params.keyword } },
    ];
  }

  return where;
}

async function validateScoreRuleInput(input: ScoreRuleInput) {
  const code = normalizeCode(input.code);
  const name = normalizeRequiredString(input.name);
  const version = parseInteger(input.version, 1);
  const category = normalizeCategory(input.category);
  const direction = normalizeDirection(input.direction);
  const points = parseNumber(input.points);
  const reviewType = normalizeReviewType(input.reviewType) || "MANUAL_REVIEW";
  const triggerType = normalizeTriggerType(input.triggerType) || "MANUAL";
  const isActive = parseBoolean(input.isActive);
  const effectiveFrom = parseDateTime(input.effectiveFrom) || new Date();
  const effectiveTo = parseDateTime(input.effectiveTo);
  const description = normalizeOptionalString(input.description);
  const configJson = normalizeOptionalString(input.configJson);

  if (!code) {
    return { ok: false as const, status: 400, message: "请填写规则 code" };
  }

  if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
    return { ok: false as const, status: 400, message: "规则 code 建议使用大写英文、数字和下划线" };
  }

  if (!name) {
    return { ok: false as const, status: 400, message: "请填写规则名称" };
  }

  if (!Number.isInteger(version) || version <= 0) {
    return { ok: false as const, status: 400, message: "规则 version 必须是大于 0 的整数" };
  }

  if (!category) {
    return { ok: false as const, status: 400, message: "请选择规则分类" };
  }

  if (!direction) {
    return { ok: false as const, status: 400, message: "请选择加分或扣分方向" };
  }

  if (points === null) {
    return { ok: false as const, status: 400, message: "规则分值必须是数字" };
  }

  if (direction === "ADD" && points <= 0) {
    return { ok: false as const, status: 400, message: "加分规则 points 必须大于 0" };
  }

  if (direction === "DEDUCT" && points > 0) {
    return { ok: false as const, status: 400, message: "扣分规则 points 必须小于或等于 0" };
  }

  if (effectiveTo && effectiveTo < effectiveFrom) {
    return { ok: false as const, status: 400, message: "失效时间不能早于生效时间" };
  }

  if (configJson) {
    try {
      JSON.parse(configJson);
    } catch {
      return { ok: false as const, status: 400, message: "configJson 必须是合法 JSON 字符串" };
    }
  }

  return {
    ok: true as const,
    data: {
      code,
      name,
      version,
      category,
      direction,
      points,
      reviewType,
      triggerType,
      isActive,
      effectiveFrom,
      effectiveTo,
      description,
      configJson,
    },
  };
}

function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeRequiredString(value);
  return normalized || null;
}

function parseInteger(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) ? number : Number.NaN;
}

function parseNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseBoolean(value: unknown) {
  if (value === "false" || value === false) return false;
  return true;
}

function parseDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCategory(value: unknown): ScoreCategory | null {
  const options: ScoreCategory[] = [
    "BASE_TRIP",
    "HOLIDAY",
    "SOCIAL",
    "REPURCHASE",
    "REFERRAL",
    "MENTORSHIP",
    "MATERIAL",
    "VIOLATION",
    "COMPLAINT",
    "SAFETY",
    "REDLINE",
    "MANUAL",
  ];
  return typeof value === "string" && options.includes(value as ScoreCategory)
    ? (value as ScoreCategory)
    : null;
}

function normalizeDirection(value: unknown): ScoreDirection | null {
  return value === "ADD" || value === "DEDUCT" ? value : null;
}

function normalizeReviewType(value: unknown): ScoreRuleReviewType | null {
  const options: ScoreRuleReviewType[] = ["AUTO", "MANUAL_REVIEW", "MANUAL_RECORD"];
  return typeof value === "string" && options.includes(value as ScoreRuleReviewType)
    ? (value as ScoreRuleReviewType)
    : null;
}

function normalizeTriggerType(value: unknown): ScoreRuleTriggerType | null {
  const options: ScoreRuleTriggerType[] = [
    "TRIP_COMPLETED",
    "SCORE_APPLICATION_APPROVED",
    "HOLIDAY_ATTENDANCE_APPROVED",
    "VIOLATION_CONFIRMED",
    "MANUAL",
  ];
  return typeof value === "string" && options.includes(value as ScoreRuleTriggerType)
    ? (value as ScoreRuleTriggerType)
    : null;
}
