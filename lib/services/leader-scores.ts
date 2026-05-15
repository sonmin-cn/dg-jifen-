import type { ScoreCategory, ScoreDirection } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type LeaderScoreFilters = {
  scoreYearId?: string;
  category?: ScoreCategory;
  direction?: ScoreDirection;
};

export async function getBoundLeaderByUserId(userId: string) {
  return prisma.leader.findUnique({
    where: { userId },
    select: {
      id: true,
      realName: true,
      nickname: true,
      userId: true,
    },
  });
}

export async function getActiveScoreYear() {
  return prisma.scoreYear.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
  });
}

export async function getLeaderScoreSummary(userId: string) {
  const [leader, activeScoreYear] = await Promise.all([
    getBoundLeaderByUserId(userId),
    getActiveScoreYear(),
  ]);

  if (!leader || !activeScoreYear) {
    return {
      leader,
      activeScoreYear,
      totalPoints: 0,
      baseTripPoints: 0,
      addPoints: 0,
      deductPoints: 0,
      recordCount: 0,
      recentRecords: [],
    };
  }

  const records = await prisma.scoreRecord.findMany({
    where: {
      scoreYearId: activeScoreYear.id,
      leaderId: leader.id,
      status: "EFFECTIVE",
    },
    include: {
      trip: {
        select: {
          id: true,
          routeName: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });

  return {
    leader,
    activeScoreYear,
    totalPoints: sumPoints(records.map((record) => record.effectivePoints)),
    baseTripPoints: sumPoints(
      records
        .filter((record) => record.category === "BASE_TRIP")
        .map((record) => record.effectivePoints),
    ),
    addPoints: sumPoints(
      records
        .filter((record) => record.direction === "ADD")
        .map((record) => record.effectivePoints),
    ),
    deductPoints: sumPoints(
      records
        .filter((record) => record.direction === "DEDUCT")
        .map((record) => record.effectivePoints),
    ),
    recordCount: records.length,
    recentRecords: records.slice(0, 5),
  };
}

export async function getLeaderScoreRecords(
  userId: string,
  filters: LeaderScoreFilters = {},
) {
  const [leader, activeScoreYear, scoreYears] = await Promise.all([
    getBoundLeaderByUserId(userId),
    getActiveScoreYear(),
    prisma.scoreYear.findMany({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  if (!leader) {
    return {
      leader,
      activeScoreYear,
      scoreYears,
      selectedScoreYearId: filters.scoreYearId || activeScoreYear?.id || "",
      records: [],
    };
  }

  const selectedScoreYearId = filters.scoreYearId || activeScoreYear?.id || "";

  if (!selectedScoreYearId) {
    return {
      leader,
      activeScoreYear,
      scoreYears,
      selectedScoreYearId,
      records: [],
    };
  }

  const records = await prisma.scoreRecord.findMany({
    where: {
      scoreYearId: selectedScoreYearId,
      leaderId: leader.id,
      status: "EFFECTIVE",
      category: filters.category,
      direction: filters.direction,
    },
    include: {
      scoreYear: {
        select: {
          id: true,
          name: true,
        },
      },
      trip: {
        select: {
          id: true,
          routeName: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });

  return {
    leader,
    activeScoreYear,
    scoreYears,
    selectedScoreYearId,
    records,
  };
}

function sumPoints(values: number[]) {
  return Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
}
