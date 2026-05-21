import type { ScoreYearStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type ScoreYearInput = {
  name?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  status?: unknown;
  remark?: unknown;
};

export async function getAdminScoreYears() {
  const scoreYears = await prisma.scoreYear.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          scoreRecords: true,
        },
      },
    },
  });

  const bonusSums = await prisma.bonusPool.groupBy({
    by: ["scoreYearId"],
    _sum: { amount: true },
  });
  const bonusAmountByYear = new Map(
    bonusSums.map((row) => [row.scoreYearId, row._sum.amount || 0]),
  );

  return scoreYears.map((scoreYear) => ({
    ...scoreYear,
    scoreRecordCount: scoreYear._count.scoreRecords,
    bonusPoolAmount: bonusAmountByYear.get(scoreYear.id) || 0,
  }));
}

export async function createScoreYear(operatorUserId: string, input: ScoreYearInput) {
  const validation = await validateScoreYearInput(input);
  if (!validation.ok) return validation;

  const overlap = await findOverlappingActiveYear({
    startDate: validation.data.startDate,
    endDate: validation.data.endDate,
  });
  if (validation.data.status === "ACTIVE" && overlap) {
    return {
      ok: false as const,
      status: 400,
      message: "该积分年度与现有 ACTIVE 年度时间范围重叠，请先关闭原年度或调整日期。",
    };
  }

  const scoreYear = await prisma.$transaction(async (tx) => {
    const created = await tx.scoreYear.create({ data: validation.data });
    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_YEAR_CREATED",
        targetType: "ScoreYear",
        targetId: created.id,
        afterJson: JSON.stringify(created),
      },
    });
    return created;
  });

  return { ok: true as const, scoreYear };
}

export async function updateScoreYear(
  id: string,
  operatorUserId: string,
  input: ScoreYearInput,
) {
  const existing = await prisma.scoreYear.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, status: 404, message: "积分年度不存在" };
  }

  const validation = await validateScoreYearInput(input);
  if (!validation.ok) return validation;

  if (validation.data.status === "ACTIVE") {
    const overlap = await findOverlappingActiveYear({
      startDate: validation.data.startDate,
      endDate: validation.data.endDate,
      excludeId: id,
    });
    if (overlap) {
      return {
        ok: false as const,
        status: 400,
        message: "该积分年度与现有 ACTIVE 年度时间范围重叠，请先关闭原年度或调整日期。",
      };
    }
  }

  const outsideRecords = await prisma.scoreRecord.count({
    where: {
      scoreYearId: id,
      OR: [
        { occurredAt: { lt: validation.data.startDate } },
        { occurredAt: { gt: endOfDay(validation.data.endDate) } },
      ],
    },
  });
  if (outsideRecords > 0) {
    return {
      ok: false as const,
      status: 400,
      message: "该年度已有积分记录不在新的日期范围内，请先核对积分记录后再调整日期。",
    };
  }

  const scoreYear = await prisma.$transaction(async (tx) => {
    const updated = await tx.scoreYear.update({
      where: { id },
      data: validation.data,
    });
    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_YEAR_UPDATED",
        targetType: "ScoreYear",
        targetId: id,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(updated),
      },
    });
    return updated;
  });

  return { ok: true as const, scoreYear };
}

export async function activateScoreYear(id: string, operatorUserId: string) {
  const existing = await prisma.scoreYear.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, status: 404, message: "积分年度不存在" };
  }

  const scoreYear = await prisma.$transaction(async (tx) => {
    await tx.scoreYear.updateMany({
      where: { status: "ACTIVE", id: { not: id } },
      data: { status: "SEALED" },
    });
    const updated = await tx.scoreYear.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_YEAR_ACTIVATED",
        targetType: "ScoreYear",
        targetId: id,
        beforeJson: JSON.stringify({ status: existing.status }),
        afterJson: JSON.stringify({ status: updated.status }),
      },
    });
    return updated;
  });

  return { ok: true as const, scoreYear };
}

export async function closeScoreYear(id: string, operatorUserId: string) {
  const existing = await prisma.scoreYear.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, status: 404, message: "积分年度不存在" };
  }

  const scoreYear = await prisma.$transaction(async (tx) => {
    const updated = await tx.scoreYear.update({
      where: { id },
      data: { status: "SEALED" },
    });
    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "SCORE_YEAR_CLOSED",
        targetType: "ScoreYear",
        targetId: id,
        beforeJson: JSON.stringify({ status: existing.status }),
        afterJson: JSON.stringify({ status: updated.status }),
      },
    });
    return updated;
  });

  return { ok: true as const, scoreYear };
}

async function validateScoreYearInput(input: ScoreYearInput) {
  const name = normalizeRequiredString(input.name);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate, true);
  const status = normalizeStatus(input.status);
  const remark = normalizeOptionalString(input.remark);

  if (!name) {
    return { ok: false as const, status: 400, message: "请填写年度名称" };
  }

  if (!startDate) {
    return { ok: false as const, status: 400, message: "请选择开始日期" };
  }

  if (!endDate) {
    return { ok: false as const, status: 400, message: "请选择结束日期" };
  }

  if (startDate > endDate) {
    return { ok: false as const, status: 400, message: "开始日期必须早于结束日期" };
  }

  if (!status) {
    return { ok: false as const, status: 400, message: "请选择年度状态" };
  }

  return {
    ok: true as const,
    data: {
      name,
      startDate,
      endDate,
      status,
      remark,
    },
  };
}

async function findOverlappingActiveYear({
  startDate,
  endDate,
  excludeId,
}: {
  startDate: Date;
  endDate: Date;
  excludeId?: string;
}) {
  return prisma.scoreYear.findFirst({
    where: {
      status: "ACTIVE",
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { id: true, name: true },
  });
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeRequiredString(value);
  return normalized || null;
}

function normalizeStatus(value: unknown): ScoreYearStatus | null {
  const options: ScoreYearStatus[] = ["NOT_STARTED", "ACTIVE", "SEALED", "SETTLED"];
  return typeof value === "string" && options.includes(value as ScoreYearStatus)
    ? (value as ScoreYearStatus)
    : null;
}

function parseDate(value: unknown, end = false) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(`${value}T${end ? "23:59:59" : "00:00:00"}+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}
