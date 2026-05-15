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

export async function getAdminScoreRecords(params: AdminScoreRecordParams) {
  const page = Math.max(params.page || 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize || 20, 1), 100);
  const where = buildScoreRecordWhere(params);

  const [records, total, effectiveRecords, distinctLeaders] = await Promise.all([
    prisma.scoreRecord.findMany({
      where,
      include: scoreRecordInclude,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scoreRecord.count({ where }),
    prisma.scoreRecord.findMany({
      where: { ...where, status: "EFFECTIVE" },
      select: {
        leaderId: true,
        direction: true,
        effectivePoints: true,
      },
    }),
    prisma.scoreRecord.findMany({
      where,
      distinct: ["leaderId"],
      select: { leaderId: true },
    }),
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
      recordCount: total,
      leaderCount: distinctLeaders.length,
    },
  };
}

export async function getAdminScoreRecordDetail(id: string) {
  return prisma.scoreRecord.findUnique({
    where: { id },
    include: scoreRecordInclude,
  });
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
