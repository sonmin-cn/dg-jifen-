import { Prisma } from "@prisma/client";
import type {
  ScoreApplicationStatus,
  ScoreApplicationType,
  ScoreRule,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  getApplicationTypeLabel,
  isSupportedApplicationType,
  mapApplicationTypeToRuleCode,
} from "@/lib/constants/score-applications";
import { buildRuleSnapshot, getActiveScoreRule } from "@/lib/services/score-rules";
import { isAllowedEvidenceImageUrl } from "@/lib/storage/evidence-url";

export type CreateLeaderApplicationInput = {
  ruleId?: unknown;
  type?: unknown;
  tripId?: unknown;
  description?: unknown;
  evidenceText?: unknown;
  evidenceUrl?: unknown;
  evidenceImages?: unknown;
  repurchaseCustomerName?: unknown;
  resubmitOfId?: unknown;
};

export type EvidenceImage = {
  url: string;
  displayUrl?: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type ApplicationEvidence = {
  text: string | null;
  url: string | null;
  images: EvidenceImage[];
};

export type AdminScoreApplicationParams = {
  keyword?: string;
  type?: ScoreApplicationType;
  status?: ScoreApplicationStatus;
  scoreYearId?: string;
  leaderId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
};

export type ApproveScoreApplicationInput = {
  approvedPoints?: unknown;
  reviewRemark?: unknown;
};

export { getApplicationTypeLabel, mapApplicationTypeToRuleCode };

export async function getLeaderApplicationTrips(userId: string) {
  const leader = await getBoundLeader(userId);

  if (!leader) {
    return { leader, trips: [] };
  }

  const tripLeaders = await prisma.tripLeader.findMany({
    where: { leaderId: leader.id },
    include: {
      trip: {
        select: {
          id: true,
          routeName: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
    orderBy: { trip: { endDate: "desc" } },
  });

  return {
    leader,
    trips: tripLeaders.map((row) => row.trip),
  };
}

export type LeaderApplicationRuleOption = {
  id: string;
  code: string;
  name: string;
  points: number;
  description: string | null;
  requireTrip: boolean;
  isRepurchase: boolean;
};

type LeaderApplicationRuleConfig = {
  allowLeaderApplication: boolean;
  requireTrip: boolean;
  perTripLimit?: number;
  annualCategoryCap?: number;
  annualCap?: number;
  maxPointsPerPost?: number;
  heartCountBased?: boolean;
  exclusiveWith?: string[];
};

export function parseLeaderApplicationRuleConfig(configJson: string | null | undefined) {
  if (!configJson) {
    return { allowLeaderApplication: false, requireTrip: false };
  }

  try {
    const parsed = JSON.parse(configJson) as Record<string, unknown>;

    return {
      allowLeaderApplication: parsed.allowLeaderApplication === true,
      requireTrip: parsed.requireTrip === true,
      perTripLimit: parseOptionalPositiveInteger(parsed.perTripLimit),
      annualCategoryCap: parseOptionalPositiveNumber(parsed.annualCategoryCap),
      annualCap: parseOptionalPositiveNumber(parsed.annualCap),
      maxPointsPerPost: parseOptionalPositiveNumber(parsed.maxPointsPerPost),
      heartCountBased: parsed.heartCountBased === true,
      exclusiveWith: Array.isArray(parsed.exclusiveWith)
        ? parsed.exclusiveWith.filter((item): item is string => typeof item === "string")
        : [],
    } satisfies LeaderApplicationRuleConfig;
  } catch {
    return { allowLeaderApplication: false, requireTrip: false };
  }
}

export async function getLeaderApplicationRules() {
  const now = new Date();
  const rules = await prisma.scoreRule.findMany({
    where: {
      isActive: true,
      direction: "ADD",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: [{ category: "asc" }, { code: "asc" }, { version: "desc" }],
  });

  const latestRulesByCode = new Map<string, (typeof rules)[number]>();

  for (const rule of rules) {
    const existing = latestRulesByCode.get(rule.code);
    if (!existing || rule.version > existing.version) {
      latestRulesByCode.set(rule.code, rule);
    }
  }

  return Array.from(latestRulesByCode.values())
    .map((rule) => ({ rule, config: parseLeaderApplicationRuleConfig(rule.configJson) }))
    .filter(({ config }) => config.allowLeaderApplication)
    .map(({ rule, config }) => ({
      id: rule.id,
      code: rule.code,
      name: rule.name,
      points: rule.points,
      description: rule.description,
      requireTrip: config.requireTrip,
      isRepurchase: rule.code === "REPURCHASE_COMPLETED",
    }));
}

export async function getApplicationTypeRules() {
  const rules = await getLeaderApplicationRules();
  return Object.fromEntries(rules.map((rule) => [rule.code, rule]));
}

export async function createLeaderScoreApplication(
  currentUserId: string,
  input: CreateLeaderApplicationInput,
) {
  const leader = await getBoundLeader(currentUserId);

  if (!leader) {
    return { ok: false as const, status: 400, message: "当前账号尚未绑定队长档案" };
  }

  const ruleId = normalizeRequiredString(input.ruleId);
  const tripId = normalizeOptionalString(input.tripId);
  const description = normalizeOptionalString(input.description);
  const evidenceText = normalizeOptionalString(input.evidenceText);
  const evidenceUrl = normalizeOptionalString(input.evidenceUrl);
  const repurchaseCustomerName = normalizeOptionalString(
    input.repurchaseCustomerName,
  );
  const resubmitOfId = normalizeOptionalString(input.resubmitOfId);
  const evidenceImagesResult = normalizeEvidenceImages(input.evidenceImages);
  const now = new Date();

  if (!ruleId) {
    return { ok: false as const, status: 400, message: "请选择积分规则" };
  }

  if (repurchaseCustomerName && repurchaseCustomerName.length > 100) {
    return { ok: false as const, status: 400, message: "老用户姓名不能超过 100 个字符" };
  }

  if (!evidenceImagesResult.ok) {
    return {
      ok: false as const,
      status: 400,
      message: evidenceImagesResult.message,
    };
  }

  const evidenceImages = evidenceImagesResult.images;

  if (!evidenceText && !evidenceUrl && evidenceImages.length === 0) {
    return { ok: false as const, status: 400, message: "请填写证明材料、证明链接或上传证明图片" };
  }

  const [scoreYear, selectedRule, trip] = await Promise.all([
    prisma.scoreYear.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
    }),
    prisma.scoreRule.findUnique({ where: { id: ruleId } }),
    tripId
      ? prisma.trip.findFirst({
          where: {
            id: tripId,
            tripLeaders: { some: { leaderId: leader.id } },
          },
          select: { id: true },
        })
      : null,
  ]);

  if (!scoreYear) {
    return { ok: false as const, status: 400, message: "未找到当前积分年度" };
  }

  if (!selectedRule) {
    return { ok: false as const, status: 400, message: "该积分规则不可申请" };
  }

  const ruleConfig = parseLeaderApplicationRuleConfig(selectedRule.configJson);

  if (
    !selectedRule.isActive ||
    selectedRule.direction !== "ADD" ||
    selectedRule.effectiveFrom > now ||
    (selectedRule.effectiveTo && selectedRule.effectiveTo < now) ||
    !ruleConfig.allowLeaderApplication
  ) {
    return { ok: false as const, status: 400, message: "该积分规则不可申请" };
  }

  if (ruleConfig.requireTrip && !tripId) {
    return { ok: false as const, status: 400, message: "该积分申请需要选择关联团期" };
  }

  if (tripId && !trip) {
    return { ok: false as const, status: 400, message: "关联团期不存在或你未参与该团期" };
  }

  let resubmitOf: { id: string; status: ScoreApplicationStatus } | null = null;

  if (resubmitOfId) {
    resubmitOf = await prisma.scoreApplication.findFirst({
      where: { id: resubmitOfId, leaderId: leader.id },
      select: { id: true, status: true },
    });

    if (!resubmitOf || !["NEEDS_MORE_INFO", "REJECTED"].includes(resubmitOf.status)) {
      return {
        ok: false as const,
        status: 400,
        message: "原申请不存在或当前状态不支持重新提交",
      };
    }
  }

  const rule = await getActiveScoreRule({ code: selectedRule.code, occurredAt: now });

  if (!rule || rule.id !== selectedRule.id) {
    return { ok: false as const, status: 400, message: "该积分规则不可申请" };
  }

  const type = inferApplicationTypeFromRule(rule);
  const ruleCode = rule.code;
  const title = rule.name;

  const duplicate = await findDuplicateApplication({
    leaderId: leader.id,
    tripId,
    ruleCode,
    evidenceText,
  });

  if (duplicate) {
    return { ok: false as const, status: 400, message: "已存在待审核或已通过的同类申请" };
  }

  if (ruleConfig.perTripLimit && tripId) {
    const existingCount = await countTripApplications({
      leaderId: leader.id,
      tripId,
      ruleCodes: [ruleCode],
    });
    if (existingCount >= ruleConfig.perTripLimit) {
      return { ok: false as const, status: 400, message: "该团期已达到该类申请次数上限" };
    }
  }

  if (ruleConfig.exclusiveWith?.length && tripId) {
    const exclusiveCount = await countTripApplications({
      leaderId: leader.id,
      tripId,
      ruleCodes: ruleConfig.exclusiveWith,
    });
    if (exclusiveCount > 0) {
      return { ok: false as const, status: 400, message: "该团期已有互斥传播申请，不能重复计分" };
    }
  }

  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.scoreApplication.create({
      data: {
        leaderId: leader.id,
        scoreYearId: scoreYear.id,
        tripId,
        type,
        status: "PENDING",
        title,
        description,
        evidenceText,
        evidenceUrl,
        evidenceJson: buildEvidenceJson({ evidenceText, evidenceUrl, evidenceImages }),
        repurchaseCustomerName,
        requestedPoints: rule.points,
        ruleId: rule.id,
        ruleCode,
      },
      include: scoreApplicationInclude,
    });

    if (resubmitOf) {
      await tx.scoreApplication.updateMany({
        where: {
          id: resubmitOf.id,
          status: { in: ["NEEDS_MORE_INFO", "REJECTED"] },
        },
        data: { status: "CANCELLED" },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: currentUserId,
        action: "SCORE_APPLICATION_CREATED",
        targetType: "ScoreApplication",
        targetId: created.id,
        afterJson: JSON.stringify({
          applicationId: created.id,
          leaderId: leader.id,
          type,
          ruleCode,
          repurchaseCustomerName,
          resubmitOfId: resubmitOf?.id || null,
          requestedPoints: rule.points,
          evidenceImageCount: evidenceImages.length,
        }),
      },
    });

    return created;
  });

  return { ok: true as const, application };
}

export async function getLeaderApplications(currentUserId: string) {
  const leader = await getBoundLeader(currentUserId);

  if (!leader) {
    return { leader, applications: [] };
  }

  const applications = await prisma.scoreApplication.findMany({
    where: { leaderId: leader.id },
    include: scoreApplicationInclude,
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
  });

  return { leader, applications };
}

export async function getAdminScoreApplications(params: AdminScoreApplicationParams) {
  const page = Math.max(params.page || 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize || 20, 1), 100);
  const where = buildApplicationWhere(params);
  const [applications, total] = await Promise.all([
    prisma.scoreApplication.findMany({
      where,
      include: scoreApplicationInclude,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scoreApplication.count({ where }),
  ]);

  return {
    applications,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

export async function getAdminScoreApplicationDetail(id: string) {
  return prisma.scoreApplication.findUnique({
    where: { id },
    include: scoreApplicationInclude,
  });
}

export async function approveScoreApplication(
  id: string,
  reviewerUserId: string,
  input: ApproveScoreApplicationInput = {},
) {
  const application = await getAdminScoreApplicationDetail(id);
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerUserId },
    select: { id: true, role: true },
  });

  if (!application) {
    return { ok: false as const, status: 404, message: "申请不存在" };
  }

  if (application.status !== "PENDING") {
    return { ok: false as const, status: 400, message: "该申请已处理，不能重复审核" };
  }

  if (!application.ruleCode) {
    return { ok: false as const, status: 400, message: "申请缺少规则编码" };
  }

  const reviewedAt = new Date();
  // 按提交时点取生效规则：规则中途调整不影响已提交申请的计分口径（与"新规则不追溯"一致）
  const rule = await getActiveScoreRule({
    code: application.ruleCode,
    occurredAt: application.submittedAt,
  });

  if (!rule) {
    return { ok: false as const, status: 400, message: "未找到申请提交时生效的积分规则" };
  }

  const requestedApprovedPoints = parseOptionalNumber(input.approvedPoints);
  const ruleConfig = parseLeaderApplicationRuleConfig(rule.configJson);
  const approvedPoints = requestedApprovedPoints ?? rule.points;

  if (!Number.isFinite(approvedPoints) || approvedPoints <= 0) {
    return { ok: false as const, status: 400, message: "审核分值必须大于 0" };
  }

  const maxRulePoints = ruleConfig.heartCountBased
    ? ruleConfig.maxPointsPerPost || rule.points
    : rule.points;

  if (approvedPoints > maxRulePoints && reviewer?.role !== "SUPER_ADMIN") {
    return {
      ok: false as const,
      status: 400,
      message: "审核分值不能高于规则允许上限",
    };
  }

  const reviewRemark = normalizeOptionalString(input.reviewRemark);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 原子占用：仅当仍为 PENDING 时更新，并发重复审核会得到 count 0
      const claimed = await tx.scoreApplication.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "APPROVED",
          approvedPoints,
          ruleId: rule.id,
          ruleCode: rule.code,
          reviewedBy: reviewerUserId,
          reviewedAt,
          remark: reviewRemark,
        },
      });

      if (claimed.count === 0) {
        throw new ScoreApplicationReviewError("该申请已处理，不能重复审核");
      }

      if (application.tripId) {
        const existingScoreRecord = await tx.scoreRecord.findFirst({
          where: {
            scoreYearId: application.scoreYearId,
            leaderId: application.leaderId,
            tripId: application.tripId,
            ruleCode: rule.code,
            status: "EFFECTIVE",
          },
          select: { id: true },
        });

        if (existingScoreRecord) {
          throw new ScoreApplicationReviewError("该申请对应积分已生成，不能重复生成");
        }
      }

      const capResult = await applyScoreApplicationCaps({
        db: tx,
        scoreYearId: application.scoreYearId,
        leaderId: application.leaderId,
        rule,
        approvedPoints,
        applicationId: application.id,
        ruleConfig,
      });
      const snapshot = {
        ...buildRuleSnapshot(rule),
        application: {
          id: application.id,
          type: application.type,
          title: application.title,
          evidenceText: application.evidenceText,
          evidenceUrl: application.evidenceUrl,
          evidenceJson: application.evidenceJson,
          repurchaseCustomerName: application.repurchaseCustomerName,
          orderNo: application.orderNo,
          requestedPoints: application.requestedPoints,
          approvedPoints,
          effectivePoints: capResult.effectivePoints,
          cap: capResult.capSnapshot,
        },
      };
      const updated = await tx.scoreApplication.findUniqueOrThrow({ where: { id } });
      const scoreRecord = await tx.scoreRecord.create({
        data: {
          scoreYearId: application.scoreYearId,
          leaderId: application.leaderId,
          tripId: application.tripId,
          applicationId: application.id,
          violationEventId: null,
          ruleId: rule.id,
          ruleCode: rule.code,
          ruleName: rule.name,
          ruleVersion: rule.version,
          rulePoints: capResult.effectivePoints,
          ruleSnapshotJson: JSON.stringify(snapshot),
          sourceType: "APPLICATION",
          sourceId: application.id,
          category: rule.category,
          item: rule.name || application.title,
          direction: "ADD",
          rawPoints: approvedPoints,
          effectivePoints: capResult.effectivePoints,
          status: "EFFECTIVE",
          occurredAt: application.submittedAt,
          approvedBy: reviewerUserId,
          approvedAt: reviewedAt,
          remark: reviewRemark
            ? `${application.title}；审核备注：${reviewRemark}`
            : application.title,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: reviewerUserId,
          action: "SCORE_APPLICATION_APPROVED",
          targetType: "ScoreApplication",
          targetId: application.id,
          afterJson: JSON.stringify({
            applicationId: application.id,
            leaderId: application.leaderId,
            type: application.type,
            ruleCode: rule.code,
            repurchaseCustomerName: application.repurchaseCustomerName,
            orderNo: application.orderNo,
            requestedPoints: application.requestedPoints,
            approvedPoints,
            reviewerUserId,
            scoreRecordId: scoreRecord.id,
          }),
        },
      });

      return { application: updated, scoreRecord };
    });

    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof ScoreApplicationReviewError) {
      return { ok: false as const, status: 400, message: error.message };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false as const,
        status: 400,
        message: "该申请已生成过积分，不能重复审核",
      };
    }

    throw error;
  }
}

class ScoreApplicationReviewError extends Error {}

export async function rejectScoreApplication(
  id: string,
  reviewerUserId: string,
  rejectReason: string,
) {
  const application = await getAdminScoreApplicationDetail(id);
  const reason = rejectReason.trim();

  if (!application) {
    return { ok: false as const, status: 404, message: "申请不存在" };
  }

  if (application.status !== "PENDING") {
    return { ok: false as const, status: 400, message: "该申请已处理，不能重复审核" };
  }

  if (!reason) {
    return { ok: false as const, status: 400, message: "请填写拒绝原因" };
  }

  const reviewedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const rejected = await tx.scoreApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: reviewerUserId,
        reviewedAt,
        rejectReason: reason,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: reviewerUserId,
        action: "SCORE_APPLICATION_REJECTED",
        targetType: "ScoreApplication",
        targetId: id,
        afterJson: JSON.stringify({
          applicationId: id,
          leaderId: application.leaderId,
          type: application.type,
          ruleCode: application.ruleCode,
          requestedPoints: application.requestedPoints,
          reviewerUserId,
          rejectReason: reason,
        }),
      },
    });

    return rejected;
  });

  return { ok: true as const, application: updated };
}

export async function requestMoreInfoScoreApplication(
  id: string,
  reviewerUserId: string,
  reason: string,
) {
  const application = await getAdminScoreApplicationDetail(id);
  const normalizedReason = reason.trim();

  if (!application) {
    return { ok: false as const, status: 404, message: "申请不存在" };
  }

  if (application.status !== "PENDING") {
    return { ok: false as const, status: 400, message: "该申请已处理，不能重复审核" };
  }

  if (!normalizedReason) {
    return { ok: false as const, status: 400, message: "请填写需要补充的内容说明" };
  }

  const reviewedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const returned = await tx.scoreApplication.update({
      where: { id },
      data: {
        status: "NEEDS_MORE_INFO",
        reviewedBy: reviewerUserId,
        reviewedAt,
        rejectReason: normalizedReason,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: reviewerUserId,
        action: "SCORE_APPLICATION_NEEDS_MORE_INFO",
        targetType: "ScoreApplication",
        targetId: id,
        afterJson: JSON.stringify({
          applicationId: id,
          leaderId: application.leaderId,
          type: application.type,
          ruleCode: application.ruleCode,
          reviewerUserId,
          reason: normalizedReason,
        }),
      },
    });

    return returned;
  });

  return { ok: true as const, application: updated };
}

export const scoreApplicationInclude = {
  leader: {
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
      level: true,
      status: true,
    },
  },
  trip: {
    select: {
      id: true,
      routeName: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  },
  scoreYear: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  rule: {
    select: {
      id: true,
      code: true,
      name: true,
      version: true,
      points: true,
    },
  },
  scoreRecord: {
    select: { id: true, effectivePoints: true, status: true },
  },
} satisfies Prisma.ScoreApplicationInclude;

async function getBoundLeader(userId: string) {
  return prisma.leader.findUnique({
    where: { userId },
    select: { id: true, realName: true, nickname: true },
  });
}

async function findDuplicateApplication({
  leaderId,
  tripId,
  ruleCode,
  evidenceText,
}: {
  leaderId: string;
  tripId: string | null;
  ruleCode: string;
  evidenceText: string | null;
}) {
  if (!tripId && !evidenceText) {
    return null;
  }

  return prisma.scoreApplication.findFirst({
    where: {
      leaderId,
      tripId,
      ruleCode,
      status: { in: ["PENDING", "APPROVED"] },
      ...(!tripId && evidenceText ? { evidenceText } : {}),
    },
    select: { id: true },
  });
}

async function countTripApplications({
  leaderId,
  tripId,
  ruleCodes,
}: {
  leaderId: string;
  tripId: string;
  ruleCodes: string[];
}) {
  if (ruleCodes.length === 0) return 0;
  return prisma.scoreApplication.count({
    where: {
      leaderId,
      tripId,
      ruleCode: { in: ruleCodes },
      status: { in: ["PENDING", "APPROVED"] },
    },
  });
}

async function applyScoreApplicationCaps({
  db,
  scoreYearId,
  leaderId,
  rule,
  approvedPoints,
  applicationId,
  ruleConfig,
}: {
  db: Prisma.TransactionClient;
  scoreYearId: string;
  leaderId: string;
  rule: ScoreRule;
  approvedPoints: number;
  applicationId: string;
  ruleConfig: LeaderApplicationRuleConfig;
}) {
  const caps = [ruleConfig.annualCategoryCap, ruleConfig.annualCap].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (caps.length === 0) {
    return {
      effectivePoints: approvedPoints,
      capSnapshot: null,
    };
  }

  const cap = Math.min(...caps);
  const used = await db.scoreRecord.aggregate({
    where: {
      scoreYearId,
      leaderId,
      status: "EFFECTIVE",
      applicationId: { not: applicationId },
      category: rule.category,
      direction: "ADD",
    },
    _sum: { effectivePoints: true },
  });
  const usedPoints = used._sum.effectivePoints || 0;
  const remaining = Math.max(cap - usedPoints, 0);
  const effectivePoints = Math.min(approvedPoints, remaining);

  return {
    effectivePoints,
    capSnapshot: {
      cap,
      usedPoints,
      remainingBeforeApproval: remaining,
      rawApprovedPoints: approvedPoints,
      effectivePoints,
      cappedPoints: Math.max(approvedPoints - effectivePoints, 0),
    },
  };
}

function inferApplicationTypeFromRule(rule: ScoreRule): ScoreApplicationType {
  if (isSupportedApplicationType(rule.code)) {
    return rule.code;
  }

  return "MOMENTS_POST";
}

function buildApplicationWhere(params: AdminScoreApplicationParams) {
  const where: Prisma.ScoreApplicationWhereInput = {};

  if (params.scoreYearId) where.scoreYearId = params.scoreYearId;
  if (params.leaderId) where.leaderId = params.leaderId;
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;
  if (params.startDate || params.endDate) {
    where.submittedAt = {
      ...(params.startDate ? { gte: params.startDate } : {}),
      ...(params.endDate ? { lte: params.endDate } : {}),
    };
  }

  if (params.keyword) {
    where.OR = [
      { title: { contains: params.keyword } },
      { evidenceText: { contains: params.keyword } },
      { evidenceUrl: { contains: params.keyword } },
      { evidenceJson: { contains: params.keyword } },
      { repurchaseCustomerName: { contains: params.keyword } },
      { leader: { realName: { contains: params.keyword } } },
      { leader: { nickname: { contains: params.keyword } } },
      { leader: { phone: { contains: params.keyword } } },
      { trip: { routeName: { contains: params.keyword } } },
    ];
  }

  return where;
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeRequiredString(value);
  return normalized || null;
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseOptionalPositiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function parseOptionalPositiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export function parseApplicationEvidence(application: {
  evidenceText?: string | null;
  evidenceUrl?: string | null;
  evidenceJson?: string | null;
}): ApplicationEvidence {
  if (!application.evidenceJson) {
    return {
      text: application.evidenceText || null,
      url: application.evidenceUrl || null,
      images: [],
    };
  }

  try {
    const parsed = JSON.parse(application.evidenceJson) as Partial<ApplicationEvidence>;
    const imagesResult = normalizeEvidenceImages(parsed.images);
    const images = imagesResult.ok ? imagesResult.images : [];

    return {
      text: normalizeOptionalString(parsed.text) || application.evidenceText || null,
      url: normalizeOptionalString(parsed.url) || application.evidenceUrl || null,
      images,
    };
  } catch {
    return {
      text: application.evidenceText || null,
      url: application.evidenceUrl || null,
      images: [],
    };
  }
}

function buildEvidenceJson({
  evidenceText,
  evidenceUrl,
  evidenceImages,
}: {
  evidenceText: string | null;
  evidenceUrl: string | null;
  evidenceImages: EvidenceImage[];
}) {
  if (!evidenceText && !evidenceUrl && evidenceImages.length === 0) {
    return null;
  }

  return JSON.stringify({
    text: evidenceText,
    url: evidenceUrl,
    images: evidenceImages,
  });
}

function normalizeEvidenceImages(value: unknown):
  | { ok: true; images: EvidenceImage[] }
  | { ok: false; message: string } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, images: [] };
  }

  if (!Array.isArray(value)) {
    return { ok: false, message: "证明图片格式不正确" };
  }

  if (value.length > 3) {
    return { ok: false, message: "最多上传 3 张证明图片" };
  }

  const images: EvidenceImage[] = [];

  for (const image of value) {
    if (!image || typeof image !== "object") {
      return { ok: false, message: "证明图片格式不正确" };
    }

    const record = image as Record<string, unknown>;
    const url = normalizeRequiredString(record.url);
    const filename = normalizeRequiredString(record.filename);
    const mimeType = normalizeRequiredString(record.mimeType);
    const size = Number(record.size);

    if (!isAllowedEvidenceImageUrl(url, "score-applications")) {
      return { ok: false, message: "证明图片地址不合法" };
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return { ok: false, message: "仅支持 JPG、PNG、WEBP 图片" };
    }

    if (!Number.isFinite(size) || size <= 0 || size > 5 * 1024 * 1024) {
      return { ok: false, message: "单张证明图片不能超过 5MB" };
    }

    images.push({
      url,
      filename: filename || url.split("/").pop() || "evidence",
      mimeType,
      size,
    });
  }

  return { ok: true, images };
}
