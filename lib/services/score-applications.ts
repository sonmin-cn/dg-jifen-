import type {
  Prisma,
  ScoreApplicationStatus,
  ScoreApplicationType,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  SCORE_APPLICATION_CONFIGS,
  getApplicationTypeLabel,
  isSupportedApplicationType,
  mapApplicationTypeToRuleCode,
} from "@/lib/constants/score-applications";
import { buildRuleSnapshot, getActiveScoreRule } from "@/lib/services/score-rules";

export type CreateLeaderApplicationInput = {
  type?: unknown;
  tripId?: unknown;
  title?: unknown;
  description?: unknown;
  evidenceText?: unknown;
  evidenceUrl?: unknown;
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

export async function getApplicationTypeRules() {
  const now = new Date();
  const entries = await Promise.all(
    Object.entries(SCORE_APPLICATION_CONFIGS).map(async ([type, config]) => {
      const rule = await getActiveScoreRule({
        code: config.ruleCode,
        occurredAt: now,
      });

      return [type, rule] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function createLeaderScoreApplication(
  currentUserId: string,
  input: CreateLeaderApplicationInput,
) {
  const leader = await getBoundLeader(currentUserId);

  if (!leader) {
    return { ok: false as const, status: 400, message: "当前账号尚未绑定队长档案" };
  }

  const typeText = normalizeRequiredString(input.type);

  if (!isSupportedApplicationType(typeText)) {
    return { ok: false as const, status: 400, message: "申请类型无效" };
  }

  const type = typeText as ScoreApplicationType;
  const config = SCORE_APPLICATION_CONFIGS[typeText];
  const ruleCode = config.ruleCode;
  const tripId = normalizeOptionalString(input.tripId);
  const title = normalizeRequiredString(input.title);
  const description = normalizeOptionalString(input.description);
  const evidenceText = normalizeOptionalString(input.evidenceText);
  const evidenceUrl = normalizeOptionalString(input.evidenceUrl);
  const now = new Date();

  if (config.requireTrip && !tripId) {
    return {
      ok: false as const,
      status: 400,
      message: config.defaultTripRequiredMessage,
    };
  }

  if (!title) {
    return { ok: false as const, status: 400, message: "请填写申请标题" };
  }

  if (config.requireEvidence && !evidenceText && !evidenceUrl) {
    return { ok: false as const, status: 400, message: "请填写证明材料或证明链接" };
  }

  const [scoreYear, rule, trip] = await Promise.all([
    prisma.scoreYear.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
    }),
    getActiveScoreRule({ code: ruleCode, occurredAt: now }),
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

  if (!rule) {
    return { ok: false as const, status: 400, message: "未找到对应积分规则" };
  }

  if (tripId && !trip) {
    return { ok: false as const, status: 400, message: "关联团期不存在或你未参与该团期" };
  }

  const duplicate = await findDuplicateApplication({
    leaderId: leader.id,
    tripId,
    ruleCode,
    type,
    evidenceText,
  });

  if (duplicate) {
    return { ok: false as const, status: 400, message: "已存在待审核或已通过的同类申请" };
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
        requestedPoints: rule.points,
        ruleId: rule.id,
        ruleCode,
      },
      include: scoreApplicationInclude,
    });

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
          requestedPoints: rule.points,
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

  const occurredAt = new Date();
  const rule = await getActiveScoreRule({
    code: application.ruleCode,
    occurredAt,
  });

  if (!rule) {
    return { ok: false as const, status: 400, message: "未找到对应积分规则" };
  }

  const requestedApprovedPoints = parseOptionalNumber(input.approvedPoints);
  const approvedPoints = requestedApprovedPoints ?? rule.points;

  if (!Number.isFinite(approvedPoints) || approvedPoints <= 0) {
    return { ok: false as const, status: 400, message: "审核分值必须大于 0" };
  }

  if (approvedPoints > rule.points && reviewer?.role !== "SUPER_ADMIN") {
    return {
      ok: false as const,
      status: 400,
      message: "审核分值不能高于规则默认分值",
    };
  }

  if (application.tripId) {
    const existingScoreRecord = await prisma.scoreRecord.findFirst({
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
      return { ok: false as const, status: 400, message: "该申请对应积分已生成，不能重复生成" };
    }
  }

  const reviewRemark = normalizeOptionalString(input.reviewRemark);
  const snapshot = {
    ...buildRuleSnapshot(rule),
    application: {
      id: application.id,
      type: application.type,
      title: application.title,
      evidenceText: application.evidenceText,
      evidenceUrl: application.evidenceUrl,
      requestedPoints: application.requestedPoints,
      approvedPoints,
    },
  };

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.scoreApplication.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedPoints,
        ruleId: rule.id,
        ruleCode: rule.code,
        reviewedBy: reviewerUserId,
        reviewedAt: occurredAt,
        remark: reviewRemark,
      },
    });
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
        rulePoints: approvedPoints,
        ruleSnapshotJson: JSON.stringify(snapshot),
        sourceType: "APPLICATION",
        sourceId: application.id,
        category: rule.category,
        item: rule.name || application.title,
        direction: "ADD",
        rawPoints: approvedPoints,
        effectivePoints: approvedPoints,
        status: "EFFECTIVE",
        occurredAt,
        approvedBy: reviewerUserId,
        approvedAt: occurredAt,
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
}

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
  scoreRecords: {
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
  type,
  evidenceText,
}: {
  leaderId: string;
  tripId: string | null;
  ruleCode: string;
  type: ScoreApplicationType;
  evidenceText: string | null;
}) {
  if (type === "REPURCHASE" && !tripId) {
    return null;
  }

  return prisma.scoreApplication.findFirst({
    where: {
      leaderId,
      tripId,
      ruleCode,
      status: { in: ["PENDING", "APPROVED"] },
      ...(type === "REPURCHASE" && evidenceText ? { evidenceText } : {}),
    },
    select: { id: true },
  });
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
