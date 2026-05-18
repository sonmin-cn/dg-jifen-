import { randomUUID } from "crypto";
import type { Prisma, ScoreCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { buildRuleSnapshot } from "@/lib/services/score-rules";

export type AdminScoreAdjustmentParams = {
  scoreYearId?: string;
  leaderId?: string;
  ruleCode?: string;
  category?: ScoreCategory;
  keyword?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
};

export type CreateScoreAdjustmentInput = {
  leaderId?: unknown;
  scoreYearId?: unknown;
  ruleId?: unknown;
  tripId?: unknown;
  occurredAt?: unknown;
  item?: unknown;
  reason?: unknown;
  evidenceText?: unknown;
  evidenceUrl?: unknown;
  points?: unknown;
  overrideReason?: unknown;
  remark?: unknown;
};

export async function getAdminScoreAdjustments(params: AdminScoreAdjustmentParams) {
  const page = Math.max(params.page || 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize || 20, 1), 100);
  const where = buildScoreAdjustmentWhere(params);
  const [records, total] = await Promise.all([
    prisma.scoreRecord.findMany({
      where,
      include: {
        leader: { select: { id: true, realName: true, nickname: true, phone: true } },
        scoreYear: { select: { id: true, name: true } },
        trip: { select: { id: true, routeName: true } },
        rule: { select: { id: true, code: true, name: true, version: true } },
      },
      orderBy: [{ createdAt: "desc" }, { occurredAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scoreRecord.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

export async function getActiveAddScoreRules(now = new Date()) {
  return prisma.scoreRule.findMany({
    where: {
      isActive: true,
      direction: "ADD",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: [{ category: "asc" }, { code: "asc" }, { version: "desc" }],
  });
}

export async function createScoreAdjustment(
  operatorUserId: string,
  input: CreateScoreAdjustmentInput,
) {
  const leaderId = normalizeRequiredString(input.leaderId);
  const scoreYearId = normalizeRequiredString(input.scoreYearId);
  const ruleId = normalizeRequiredString(input.ruleId);
  const tripId = normalizeOptionalString(input.tripId);
  const occurredAt = parseDateTime(input.occurredAt) || new Date();
  const item = normalizeRequiredString(input.item);
  const reason = normalizeRequiredString(input.reason);
  const evidenceText = normalizeRequiredString(input.evidenceText);
  const evidenceUrl = normalizeOptionalString(input.evidenceUrl);
  const points = parsePositiveNumber(input.points);
  const overrideReason = normalizeOptionalString(input.overrideReason);
  const remark = normalizeOptionalString(input.remark);

  if (!leaderId) return { ok: false as const, status: 400, message: "请选择队长" };
  if (!scoreYearId) return { ok: false as const, status: 400, message: "请选择积分年度" };
  if (!ruleId) return { ok: false as const, status: 400, message: "请选择积分规则" };
  if (!item) return { ok: false as const, status: 400, message: "请填写加分标题" };
  if (!reason) return { ok: false as const, status: 400, message: "请填写加分原因" };
  if (!evidenceText) return { ok: false as const, status: 400, message: "请填写证据说明" };
  if (points === null || points <= 0) {
    return { ok: false as const, status: 400, message: "加分分值必须大于 0" };
  }

  const [leader, scoreYear, rule, trip] = await Promise.all([
    prisma.leader.findUnique({ where: { id: leaderId }, select: { id: true, realName: true } }),
    prisma.scoreYear.findUnique({ where: { id: scoreYearId }, select: { id: true, name: true } }),
    prisma.scoreRule.findUnique({ where: { id: ruleId } }),
    tripId
      ? prisma.trip.findUnique({ where: { id: tripId }, select: { id: true, routeName: true } })
      : null,
  ]);

  if (!leader) return { ok: false as const, status: 400, message: "队长不存在" };
  if (!scoreYear) return { ok: false as const, status: 400, message: "积分年度不存在" };
  if (!rule) return { ok: false as const, status: 400, message: "积分规则不存在" };
  if (!rule.isActive) return { ok: false as const, status: 400, message: "积分规则已停用" };
  if (rule.direction !== "ADD") {
    return { ok: false as const, status: 400, message: "专项加分只能选择加分规则" };
  }
  if (rule.effectiveFrom > occurredAt || (rule.effectiveTo && rule.effectiveTo < occurredAt)) {
    return { ok: false as const, status: 400, message: "该规则在发生时间不生效" };
  }
  if (tripId && !trip) return { ok: false as const, status: 400, message: "关联团期不存在" };
  if (points !== rule.points && !overrideReason) {
    return { ok: false as const, status: 400, message: "覆盖规则默认分值时必须填写覆盖原因" };
  }

  const duplicate = await findDuplicateAdjustment({
    leaderId,
    tripId,
    ruleId,
    occurredAt,
    item,
  });

  if (duplicate) {
    return { ok: false as const, status: 400, message: "已存在同一天同队长同规则同标题的专项加分" };
  }

  const tripParticipation = tripId
    ? await prisma.tripLeader.findUnique({
        where: { tripId_leaderId: { tripId, leaderId } },
        select: { id: true, role: true, actualWorkDays: true, isCompleted: true },
      })
    : null;
  const sourceId = `manual-adjustment:${randomUUID()}`;
  const snapshot = {
    ...buildRuleSnapshot(rule),
    adjustment: {
      reason,
      evidenceText,
      evidenceUrl,
      originalRulePoints: rule.points,
      actualPoints: points,
      overrideReason,
      operatorUserId,
      tripId,
      tripParticipation,
    },
  };
  const fullRemark = [
    `加分原因：${reason}`,
    `证据说明：${evidenceText}`,
    evidenceUrl ? `证据链接：${evidenceUrl}` : "",
    remark ? `备注：${remark}` : "",
    overrideReason ? `覆盖原因：${overrideReason}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const scoreRecord = await prisma.$transaction(async (tx) => {
    const created = await tx.scoreRecord.create({
      data: {
        scoreYearId,
        leaderId,
        tripId,
        applicationId: null,
        violationEventId: null,
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        ruleVersion: rule.version,
        rulePoints: rule.points,
        ruleSnapshotJson: JSON.stringify(snapshot),
        sourceType: "MANUAL",
        sourceId,
        category: rule.category,
        item,
        direction: "ADD",
        rawPoints: points,
        effectivePoints: points,
        status: "EFFECTIVE",
        occurredAt,
        approvedBy: operatorUserId,
        approvedAt: new Date(),
        remark: fullRemark,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_ADJUSTMENT_CREATED",
        targetType: "ScoreRecord",
        targetId: created.id,
        afterJson: JSON.stringify({
          operatorUserId,
          leaderId,
          scoreYearId,
          ruleId: rule.id,
          ruleCode: rule.code,
          points,
          scoreRecordId: created.id,
          reason,
          evidenceText,
          evidenceUrl,
          overrideReason,
          tripId,
        }),
      },
    });

    return created;
  });

  return { ok: true as const, scoreRecord };
}

function buildScoreAdjustmentWhere(params: AdminScoreAdjustmentParams): Prisma.ScoreRecordWhereInput {
  const where: Prisma.ScoreRecordWhereInput = {
    sourceType: "MANUAL",
    direction: "ADD",
  };

  if (params.scoreYearId) where.scoreYearId = params.scoreYearId;
  if (params.leaderId) where.leaderId = params.leaderId;
  if (params.ruleCode) where.ruleCode = params.ruleCode;
  if (params.category) where.category = params.category;
  if (params.startDate || params.endDate) {
    where.occurredAt = {
      ...(params.startDate ? { gte: params.startDate } : {}),
      ...(params.endDate ? { lte: params.endDate } : {}),
    };
  }
  if (params.keyword) {
    where.OR = [
      { item: { contains: params.keyword } },
      { remark: { contains: params.keyword } },
      { ruleCode: { contains: params.keyword } },
      { ruleName: { contains: params.keyword } },
      { leader: { realName: { contains: params.keyword } } },
      { leader: { nickname: { contains: params.keyword } } },
      { leader: { phone: { contains: params.keyword } } },
      { trip: { routeName: { contains: params.keyword } } },
    ];
  }

  return where;
}

function findDuplicateAdjustment({
  leaderId,
  tripId,
  ruleId,
  occurredAt,
  item,
}: {
  leaderId: string;
  tripId: string | null;
  ruleId: string;
  occurredAt: Date;
  item: string;
}) {
  const start = new Date(occurredAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(occurredAt);
  end.setHours(23, 59, 59, 999);

  return prisma.scoreRecord.findFirst({
    where: {
      leaderId,
      tripId,
      ruleId,
      item,
      sourceType: "MANUAL",
      direction: "ADD",
      status: "EFFECTIVE",
      occurredAt: { gte: start, lte: end },
    },
    select: { id: true },
  });
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeRequiredString(value);
  return normalized || null;
}

function parsePositiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
