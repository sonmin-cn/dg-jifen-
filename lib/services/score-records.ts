import type {
  Prisma,
  ScoreCategory,
  ScoreDirection,
  ScoreRecordStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AdminScoreRecordParams = {
  keyword?: string;
  scoreYearId?: string;
  leaderId?: string;
  category?: ScoreCategory;
  direction?: ScoreDirection;
  status?: ScoreRecordStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
};

export type VoidScoreRecordInput = {
  voidReason?: unknown;
};

export async function getAdminScoreRecords(params: AdminScoreRecordParams) {
  const page = Math.max(params.page || 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize || 20, 1), 100);
  const where = buildScoreRecordWhere(params);

  const shouldCollectEffectiveStats = !params.status || params.status === "EFFECTIVE";
  const [records, total, effectiveRecords] = await Promise.all([
    prisma.scoreRecord.findMany({
      where,
      include: scoreRecordInclude,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scoreRecord.count({ where }),
    shouldCollectEffectiveStats
      ? prisma.scoreRecord.findMany({
          where: { ...where, status: "EFFECTIVE" },
          select: {
            leaderId: true,
            direction: true,
            effectivePoints: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const effectiveTotalPoints = sumPoints(
    effectiveRecords.map((record) => record.effectivePoints),
  );
  const addPoints = sumPoints(
    effectiveRecords
      .filter((record) => record.direction === "ADD")
      .map((record) => record.effectivePoints),
  );
  const deductPoints = sumPoints(
    effectiveRecords
      .filter((record) => record.direction === "DEDUCT")
      .map((record) => record.effectivePoints),
  );

  return {
    records,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(Math.ceil(total / pageSize), 1),
    },
    stats: {
      effectiveTotalPoints,
      addPoints,
      deductPoints,
      recordCount: effectiveRecords.length,
      leaderCount: new Set(effectiveRecords.map((record) => record.leaderId)).size,
    },
  };
}

export async function getAdminScoreRecordDetail(id: string) {
  return prisma.scoreRecord.findUnique({
    where: { id },
    include: scoreRecordInclude,
  });
}

export async function voidScoreRecord(
  id: string,
  operatorUserId: string,
  input: VoidScoreRecordInput,
) {
  const voidReason = normalizeRequiredString(input.voidReason);

  if (!voidReason) {
    return { ok: false as const, status: 400, message: "请填写作废原因" };
  }

  if (voidReason.length < 5) {
    return { ok: false as const, status: 400, message: "作废原因不能少于 5 个字" };
  }

  const record = await prisma.scoreRecord.findUnique({
    where: { id },
    include: {
      trip: { select: { id: true } },
      application: { select: { id: true, remark: true } },
      violationEvent: { select: { id: true, remark: true, status: true } },
    },
  });

  if (!record) {
    return { ok: false as const, status: 404, message: "积分记录不存在" };
  }

  if (record.status === "VOIDED") {
    return { ok: false as const, status: 400, message: "该积分记录已作废，不能重复作废" };
  }

  const voidedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.scoreRecord.update({
      where: { id },
      data: {
        status: "VOIDED",
        voidReason,
        voidedBy: operatorUserId,
        voidedAt,
      },
    });

    const unlockedTripLeaders = await tx.tripLeader.updateMany({
      where: { baseScoreRecordId: id },
      data: {
        baseScoreRecordId: null,
        baseScoreGeneratedAt: null,
      },
    });

    if (record.applicationId && record.application) {
      await tx.scoreApplication.update({
        where: { id: record.applicationId },
        data: {
          remark: appendRemark(record.application?.remark, `对应积分已作废：${voidReason}`),
        },
      });
    }

    if (record.violationEventId && record.violationEvent) {
      await tx.violationEvent.update({
        where: { id: record.violationEventId },
        data: {
          status: "REVOKED",
          remark: appendRemark(record.violationEvent?.remark, `对应积分已作废：${voidReason}`),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_RECORD_VOIDED",
        targetType: "ScoreRecord",
        targetId: id,
        beforeJson: JSON.stringify({
          id: record.id,
          status: record.status,
          leaderId: record.leaderId,
          effectivePoints: record.effectivePoints,
          ruleCode: record.ruleCode,
          sourceType: record.sourceType,
          sourceId: record.sourceId,
          applicationId: record.applicationId,
          violationEventId: record.violationEventId,
          tripId: record.tripId,
        }),
        afterJson: JSON.stringify({
          scoreRecordId: id,
          leaderId: record.leaderId,
          originalPoints: record.effectivePoints,
          ruleCode: record.ruleCode,
          voidReason,
          voidedBy: operatorUserId,
          voidedAt: voidedAt.toISOString(),
          sourceType: record.sourceType,
          applicationId: record.applicationId,
          violationEventId: record.violationEventId,
          tripId: record.tripId,
          unlockedTripLeaderCount: unlockedTripLeaders.count,
        }),
      },
    });

    return updated;
  });

  return { ok: true as const, record: result };
}

export function formatScorePoints(points: number) {
  if (points === 0) {
    return "0";
  }

  const absolute = Math.abs(points);
  const text = Number.isInteger(absolute) ? String(absolute) : absolute.toFixed(2);
  return `${points > 0 ? "+" : "-"}${text}`;
}

export function parseRuleSnapshotJson(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export const scoreRecordInclude = {
  leader: {
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
      level: true,
      status: true,
      region: true,
      residentLocation: true,
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
    },
  },
} satisfies Prisma.ScoreRecordInclude;

function buildScoreRecordWhere(params: AdminScoreRecordParams) {
  const where: Prisma.ScoreRecordWhereInput = {};

  if (params.scoreYearId) {
    where.scoreYearId = params.scoreYearId;
  }

  if (params.leaderId) {
    where.leaderId = params.leaderId;
  }

  if (params.category) {
    where.category = params.category;
  }

  if (params.direction) {
    where.direction = params.direction;
  }

  if (params.status) {
    where.status = params.status;
  }

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
      { leader: { realName: { contains: params.keyword } } },
      { leader: { nickname: { contains: params.keyword } } },
      { leader: { phone: { contains: params.keyword } } },
      { trip: { routeName: { contains: params.keyword } } },
    ];
  }

  return where;
}

function sumPoints(values: number[]) {
  return Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function appendRemark(current: string | null | undefined, addition: string) {
  return current ? `${current}\n${addition}` : addition;
}
