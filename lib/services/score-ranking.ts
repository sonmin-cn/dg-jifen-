import type { Leader, LeaderStatus, Prisma, ScoreCategory, ScoreYear } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type ScoreRankingParams = {
  scoreYearId?: string;
  leaderStatus?: LeaderStatus;
  level?: string;
  region?: string;
  keyword?: string;
  bonusEligible?: "true" | "false";
  limit?: number | "all";
};

export type ScoreRankingRow = {
  rank: number;
  leader: Pick<
    Leader,
    | "id"
    | "realName"
    | "nickname"
    | "phone"
    | "status"
    | "level"
    | "region"
    | "residentLocation"
    | "externalLeaderId"
  >;
  totalPoints: number;
  baseTripPoints: number;
  applicationPoints: number;
  holidayPoints: number;
  otherAddPoints: number;
  deductPoints: number;
  effectiveRecordCount: number;
  tripCount: number;
  tripDays: number;
  bonusEligible: boolean;
};

export type ScoreRankingSummary = {
  rankingCount: number;
  totalPoints: number;
  averagePoints: number;
  highestPoints: number;
  eligibleCount: number;
  ineligibleCount: number;
  deductLeaderCount: number;
};

const BONUS_TRIP_COUNT_THRESHOLD = 8;
const APPLICATION_CATEGORIES: ScoreCategory[] = [
  "SOCIAL",
  "REPURCHASE",
  "REFERRAL",
  "MENTORSHIP",
  "MATERIAL",
];

export async function getAdminScoreRanking(params: ScoreRankingParams) {
  const selectedScoreYear = params.scoreYearId
    ? await prisma.scoreYear.findUnique({ where: { id: params.scoreYearId } })
    : await prisma.scoreYear.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      });

  if (!selectedScoreYear) {
    return {
      scoreYear: null,
      scoreYears: await getScoreYears(),
      rows: [] as ScoreRankingRow[],
      allRows: [] as ScoreRankingRow[],
      summary: emptySummary(),
      limit: normalizeLimit(params.limit),
    };
  }

  const limit = normalizeLimit(params.limit);
  const leaderWhere = buildLeaderWhere(params);
  const leaders = await prisma.leader.findMany({
    where: leaderWhere,
    orderBy: { realName: "asc" },
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
      status: true,
      level: true,
      region: true,
      residentLocation: true,
      externalLeaderId: true,
    },
  });
  const leaderIds = leaders.map((leader) => leader.id);

  if (leaderIds.length === 0) {
    return {
      scoreYear: selectedScoreYear,
      scoreYears: await getScoreYears(),
      rows: [],
      allRows: [],
      summary: emptySummary(),
      limit,
    };
  }

  const range = getScoreYearDateRange(selectedScoreYear);
  const [scoreRecords, tripLeaders, scoreYears] = await Promise.all([
    prisma.scoreRecord.findMany({
      where: {
        scoreYearId: selectedScoreYear.id,
        status: "EFFECTIVE",
        leaderId: { in: leaderIds },
      },
      select: {
        leaderId: true,
        category: true,
        direction: true,
        effectivePoints: true,
        applicationId: true,
      },
    }),
    prisma.tripLeader.findMany({
      where: {
        leaderId: { in: leaderIds },
        isCompleted: true,
        trip: {
          status: "COMPLETED",
          endDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
      },
      select: {
        leaderId: true,
        actualWorkDays: true,
      },
    }),
    getScoreYears(),
  ]);

  const aggregates = new Map<string, Omit<ScoreRankingRow, "rank" | "leader" | "bonusEligible">>();

  for (const leader of leaders) {
    aggregates.set(leader.id, {
      totalPoints: 0,
      baseTripPoints: 0,
      applicationPoints: 0,
      holidayPoints: 0,
      otherAddPoints: 0,
      deductPoints: 0,
      effectiveRecordCount: 0,
      tripCount: 0,
      tripDays: 0,
    });
  }

  for (const record of scoreRecords) {
    const row = aggregates.get(record.leaderId);
    if (!row) continue;
    row.totalPoints += record.effectivePoints;
    row.effectiveRecordCount += 1;

    if (record.category === "BASE_TRIP") {
      row.baseTripPoints += record.effectivePoints;
    } else if (record.category === "HOLIDAY") {
      row.holidayPoints += record.effectivePoints;
    } else if (record.direction === "ADD" && APPLICATION_CATEGORIES.includes(record.category)) {
      row.applicationPoints += record.effectivePoints;
    } else if (record.direction === "ADD") {
      row.otherAddPoints += record.effectivePoints;
    }

    if (record.direction === "DEDUCT") {
      row.deductPoints += record.effectivePoints;
    }
  }

  for (const tripLeader of tripLeaders) {
    const row = aggregates.get(tripLeader.leaderId);
    if (!row) continue;
    row.tripCount += 1;
    row.tripDays += tripLeader.actualWorkDays || 0;
  }

  const leaderById = new Map(leaders.map((leader) => [leader.id, leader]));
  let rows = Array.from(aggregates.entries())
    .map(([leaderId, row]) => {
      const leader = leaderById.get(leaderId);
      if (!leader) return null;
      return {
        rank: 0,
        leader,
        totalPoints: roundPoints(row.totalPoints),
        baseTripPoints: roundPoints(row.baseTripPoints),
        applicationPoints: roundPoints(row.applicationPoints),
        holidayPoints: roundPoints(row.holidayPoints),
        otherAddPoints: roundPoints(row.otherAddPoints),
        deductPoints: roundPoints(row.deductPoints),
        effectiveRecordCount: row.effectiveRecordCount,
        tripCount: row.tripCount,
        tripDays: roundPoints(row.tripDays),
        bonusEligible: row.tripCount >= BONUS_TRIP_COUNT_THRESHOLD,
      } satisfies ScoreRankingRow;
    })
    .filter((row): row is ScoreRankingRow => Boolean(row))
    .filter((row) => row.effectiveRecordCount > 0 || row.tripCount > 0);

  if (params.bonusEligible === "true") {
    rows = rows.filter((row) => row.bonusEligible);
  } else if (params.bonusEligible === "false") {
    rows = rows.filter((row) => !row.bonusEligible);
  }

  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.tripCount !== a.tripCount) return b.tripCount - a.tripCount;
    if (b.tripDays !== a.tripDays) return b.tripDays - a.tripDays;
    return a.leader.realName.localeCompare(b.leader.realName, "zh-Hans-CN");
  });

  const rankedRows = rows.map((row, index) => ({ ...row, rank: index + 1 }));
  const limitedRows = limit === "all" ? rankedRows : rankedRows.slice(0, limit);

  return {
    scoreYear: selectedScoreYear,
    scoreYears,
    rows: limitedRows,
    allRows: rankedRows,
    summary: getScoreRankingSummary(limitedRows),
    limit,
  };
}

export function getScoreRankingSummary(rows: ScoreRankingRow[]): ScoreRankingSummary {
  const totalPoints = roundPoints(rows.reduce((total, row) => total + row.totalPoints, 0));
  const rankingCount = rows.length;

  return {
    rankingCount,
    totalPoints,
    averagePoints: rankingCount > 0 ? roundPoints(totalPoints / rankingCount) : 0,
    highestPoints: rows[0]?.totalPoints ?? 0,
    eligibleCount: rows.filter((row) => row.bonusEligible).length,
    ineligibleCount: rows.filter((row) => !row.bonusEligible).length,
    deductLeaderCount: rows.filter((row) => row.deductPoints < 0).length,
  };
}

export function getScoreYearDateRange(scoreYear: Pick<ScoreYear, "startDate" | "endDate">) {
  return {
    startDate: scoreYear.startDate,
    endDate: scoreYear.endDate,
  };
}

export function formatRankingPoints(points: number, options?: { signed?: boolean }) {
  if (points === 0) return "0";
  const text = Number.isInteger(Math.abs(points))
    ? String(Math.abs(points))
    : Math.abs(points).toFixed(2);

  if (options?.signed) {
    return `${points > 0 ? "+" : "-"}${text}`;
  }

  return points < 0 ? `-${text}` : text;
}

function buildLeaderWhere(params: ScoreRankingParams): Prisma.LeaderWhereInput {
  const where: Prisma.LeaderWhereInput = {};
  const andFilters: Prisma.LeaderWhereInput[] = [];

  if (params.leaderStatus) where.status = params.leaderStatus;
  if (params.level) where.level = params.level;
  if (params.region) {
    andFilters.push({
      OR: [
        { region: { contains: params.region } },
        { residentLocation: { contains: params.region } },
      ],
    });
  }
  if (params.keyword) {
    andFilters.push({
      OR: [
        { realName: { contains: params.keyword } },
        { nickname: { contains: params.keyword } },
        { phone: { contains: params.keyword } },
        { externalLeaderId: { contains: params.keyword } },
      ],
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return where;
}

function normalizeLimit(value: ScoreRankingParams["limit"]) {
  if (value === "all") return "all" as const;
  if (value === 100) return 100;
  return 50;
}

function emptySummary(): ScoreRankingSummary {
  return {
    rankingCount: 0,
    totalPoints: 0,
    averagePoints: 0,
    highestPoints: 0,
    eligibleCount: 0,
    ineligibleCount: 0,
    deductLeaderCount: 0,
  };
}

function roundPoints(value: number) {
  return Math.round(value * 100) / 100;
}

function getScoreYears() {
  return prisma.scoreYear.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });
}
