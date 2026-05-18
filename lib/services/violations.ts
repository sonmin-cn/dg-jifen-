import type {
  Prisma,
  ScoreCategory,
  ViolationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  VIOLATION_CONFIGS,
  VIOLATION_RULE_OPTIONS,
  getViolationRuleLabel,
  isSupportedViolationRuleCode,
  type ViolationRuleCode,
} from "@/lib/constants/violations";
import { buildRuleSnapshot, getActiveScoreRule } from "@/lib/services/score-rules";

export type CreateViolationInput = {
  leaderId?: unknown;
  ruleCode?: unknown;
  tripId?: unknown;
  occurredAt?: unknown;
  title?: unknown;
  description?: unknown;
  evidenceText?: unknown;
  evidenceUrl?: unknown;
  remark?: unknown;
};

export type AdminViolationParams = {
  keyword?: string;
  ruleCode?: string;
  category?: ScoreCategory;
  leaderId?: string;
  tripId?: string;
  status?: ViolationStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
};

export async function getViolationRulePreview() {
  const occurredAt = new Date();
  const entries = await Promise.all(
    VIOLATION_RULE_OPTIONS.map(async (ruleCode) => {
      const rule = await getActiveScoreRule({ code: ruleCode, occurredAt });
      return [
        ruleCode,
        {
          points: rule ? normalizeDeductPoints(rule.points) : null,
          name: rule?.name || VIOLATION_CONFIGS[ruleCode].label,
          category: rule?.category || VIOLATION_CONFIGS[ruleCode].category,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    ViolationRuleCode,
    { points: number | null; name: string; category: ScoreCategory }
  >;
}

export async function createViolationEvent(
  operatorUserId: string,
  input: CreateViolationInput,
) {
  const leaderId = normalizeRequiredString(input.leaderId);
  const ruleCodeText = normalizeRequiredString(input.ruleCode);
  const tripId = normalizeOptionalString(input.tripId);
  const titleInput = normalizeOptionalString(input.title);
  const description = normalizeOptionalString(input.description) || "";
  const evidenceText = normalizeOptionalString(input.evidenceText);
  const evidenceUrl = normalizeOptionalString(input.evidenceUrl);
  const remark = normalizeOptionalString(input.remark);
  const occurredAt = parseDateTime(input.occurredAt) || new Date();
  const handledAt = new Date();

  if (!leaderId) {
    return { ok: false as const, status: 400, message: "请选择队长" };
  }

  if (!isSupportedViolationRuleCode(ruleCodeText)) {
    return { ok: false as const, status: 400, message: "扣分类型无效" };
  }

  const ruleCode = ruleCodeText;
  const config = VIOLATION_CONFIGS[ruleCode];

  if (config.requiresTrip && !tripId) {
    return {
      ok: false as const,
      status: 400,
      message: `${config.label}必须选择关联团期`,
    };
  }

  const [leader, scoreYear, rule, trip] = await Promise.all([
    prisma.leader.findUnique({
      where: { id: leaderId },
      select: { id: true, realName: true, nickname: true },
    }),
    prisma.scoreYear.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: { id: true },
    }),
    getActiveScoreRule({ code: ruleCode, occurredAt }),
    tripId
      ? prisma.trip.findFirst({
          where: {
            id: tripId,
            tripLeaders: { some: { leaderId } },
          },
          select: { id: true, routeName: true },
        })
      : null,
  ]);

  if (!leader) {
    return { ok: false as const, status: 400, message: "队长不存在" };
  }

  if (!scoreYear) {
    return { ok: false as const, status: 400, message: "未找到当前积分年度" };
  }

  if (!rule) {
    return { ok: false as const, status: 400, message: "未找到对应扣分规则" };
  }

  if (tripId && !trip) {
    return { ok: false as const, status: 400, message: "关联团期不存在或该队长未参与该团期" };
  }

  const title = titleInput || rule.name || config.label;
  const duplicate = await findDuplicateViolation({
    leaderId,
    tripId,
    ruleCode,
    occurredAt,
    title,
  });

  if (duplicate) {
    return { ok: false as const, status: 400, message: "已存在同日同类型同标题的扣分事件" };
  }

  const points = normalizeDeductPoints(rule.points);
  const snapshot = {
    ...buildRuleSnapshot(rule),
    violation: {
      ruleCode,
      label: config.label,
      title,
      description,
      evidenceText,
      evidenceUrl,
      tripId,
      occurredAt: occurredAt.toISOString(),
      calculatedPoints: points,
    },
  };

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.violationEvent.create({
      data: {
        scoreYearId: scoreYear.id,
        leaderId,
        tripId,
        ruleId: rule.id,
        ruleCode: rule.code,
        type: config.type,
        severity: config.defaultSeverity,
        title,
        description,
        evidenceText,
        evidenceUrl,
        remark,
        points,
        status: "EFFECTIVE",
        createdBy: operatorUserId,
        handledBy: operatorUserId,
        approvedBy: operatorUserId,
        occurredAt,
        handledAt,
        approvedAt: handledAt,
        disqualifyBonus: Boolean(parseRuleConfig(rule.configJson)?.disqualifyBonus),
        clearPoints: Boolean(parseRuleConfig(rule.configJson)?.clearPoints),
      },
    });

    const scoreRecord = await tx.scoreRecord.create({
      data: {
        scoreYearId: scoreYear.id,
        leaderId,
        tripId,
        applicationId: null,
        violationEventId: event.id,
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        ruleVersion: rule.version,
        rulePoints: points,
        ruleSnapshotJson: JSON.stringify(snapshot),
        sourceType: "VIOLATION_EVENT",
        sourceId: event.id,
        category: rule.category,
        item: rule.name || config.label,
        direction: "DEDUCT",
        rawPoints: points,
        effectivePoints: points,
        status: "EFFECTIVE",
        occurredAt,
        approvedBy: operatorUserId,
        approvedAt: handledAt,
        remark: buildViolationRemark({ title, description, remark }),
      },
    });

    const updatedEvent = await tx.violationEvent.update({
      where: { id: event.id },
      data: { scoreRecordId: scoreRecord.id },
      include: violationEventInclude,
    });

    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "VIOLATION_EVENT_CREATED",
        targetType: "ViolationEvent",
        targetId: event.id,
        afterJson: JSON.stringify({
          leaderId,
          tripId,
          ruleCode,
          points,
          violationEventId: event.id,
          scoreRecordId: scoreRecord.id,
          operatorUserId,
        }),
      },
    });

    return { event: updatedEvent, scoreRecord };
  });

  return { ok: true as const, ...result };
}

export async function getAdminViolations(params: AdminViolationParams) {
  const page = Math.max(params.page || 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize || 20, 1), 100);
  const where = buildViolationWhere(params);
  const [events, total] = await Promise.all([
    prisma.violationEvent.findMany({
      where,
      include: violationEventInclude,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.violationEvent.count({ where }),
  ]);

  return {
    events,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

export async function getAdminViolationDetail(id: string) {
  return prisma.violationEvent.findUnique({
    where: { id },
    include: violationEventInclude,
  });
}

export const violationEventInclude = {
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
      category: true,
    },
  },
  scoreRecords: {
    select: {
      id: true,
      effectivePoints: true,
      status: true,
      ruleSnapshotJson: true,
    },
  },
} satisfies Prisma.ViolationEventInclude;

function buildViolationWhere(params: AdminViolationParams) {
  const where: Prisma.ViolationEventWhereInput = {};

  if (params.ruleCode) where.ruleCode = params.ruleCode;
  if (params.leaderId) where.leaderId = params.leaderId;
  if (params.tripId) where.tripId = params.tripId;
  if (params.status) where.status = params.status;
  if (params.category) {
    where.rule = { category: params.category };
  }
  if (params.startDate || params.endDate) {
    where.occurredAt = {
      ...(params.startDate ? { gte: params.startDate } : {}),
      ...(params.endDate ? { lte: params.endDate } : {}),
    };
  }

  if (params.keyword) {
    where.OR = [
      { title: { contains: params.keyword } },
      { description: { contains: params.keyword } },
      { evidenceText: { contains: params.keyword } },
      { leader: { realName: { contains: params.keyword } } },
      { leader: { nickname: { contains: params.keyword } } },
      { leader: { phone: { contains: params.keyword } } },
      { trip: { routeName: { contains: params.keyword } } },
    ];
  }

  return where;
}

async function findDuplicateViolation({
  leaderId,
  tripId,
  ruleCode,
  occurredAt,
  title,
}: {
  leaderId: string;
  tripId: string | null;
  ruleCode: string;
  occurredAt: Date;
  title: string;
}) {
  const start = new Date(occurredAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(occurredAt);
  end.setHours(23, 59, 59, 999);

  return prisma.violationEvent.findFirst({
    where: {
      leaderId,
      tripId,
      ruleCode,
      title,
      status: "EFFECTIVE",
      occurredAt: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true },
  });
}

function normalizeDeductPoints(points: number) {
  if (points === 0) return 0;
  return points > 0 ? -points : points;
}

function parseRuleConfig(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as { disqualifyBonus?: boolean; clearPoints?: boolean };
  } catch {
    return null;
  }
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeRequiredString(value);
  return normalized || null;
}

function buildViolationRemark({
  title,
  description,
  remark,
}: {
  title: string;
  description: string;
  remark: string | null;
}) {
  return [title, description, remark ? `处理备注：${remark}` : ""]
    .filter(Boolean)
    .join("；");
}

function parseDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export { getViolationRuleLabel };
