import { prisma } from "@/lib/db/prisma";
import {
  formatRankingPoints,
  getAdminScoreRanking,
  type ScoreRankingRow,
} from "@/lib/services/score-ranking";

const BONUS_CAP_AMOUNT = 2000;
const BONUS_TRIP_COUNT_THRESHOLD = 8;

export type CreateBonusPoolInput = {
  scoreYearId?: unknown;
  title?: unknown;
  amount?: unknown;
  sourceType?: unknown;
  description?: unknown;
  injectedAt?: unknown;
};

export type SaveBonusSettlementInput = {
  scoreYearId?: unknown;
  title?: unknown;
  remark?: unknown;
};

export type BonusSettlementItemPreview = {
  leaderId: string;
  leaderName: string;
  nickname: string | null;
  leaderStatus: string;
  level: string | null;
  rank: number;
  totalPoints: number;
  baseTripPoints: number;
  applicationPoints: number;
  deductPoints: number;
  tripCount: number;
  tripDays: number;
  eligible: boolean;
  ineligibleReason: string | null;
  pointShare: number;
  calculatedAmount: number;
  cappedAmount: number;
  finalAmount: number;
};

type BonusLeaderSnapshot = {
  id: string;
  realName: string;
  nickname: string | null;
  status: string;
  level: string | null;
};

export type BonusSettlementPreview = {
  scoreYearId: string;
  scoreYearName: string;
  totalPoolAmount: number;
  eligibleLeaderCount: number;
  totalEffectivePoints: number;
  totalEligiblePoints: number;
  totalCalculatedAmount: number;
  totalFinalAmount: number;
  totalCappedAmount: number;
  undistributedAmount: number;
  capAmount: number;
  items: BonusSettlementItemPreview[];
};

export async function getBonusPoolSummary(scoreYearId: string) {
  const entries = await prisma.bonusPool.findMany({
    where: { scoreYearId },
    orderBy: { injectedAt: "desc" },
    include: {
      scoreYear: {
        select: { id: true, name: true, status: true },
      },
    },
  });
  const totalAmount = roundMoney(entries.reduce((sum, entry) => sum + entry.amount, 0));

  return {
    totalAmount,
    entryCount: entries.length,
    latestInjectedAt: entries[0]?.injectedAt ?? null,
    entries,
  };
}

export async function createBonusPoolEntry(
  input: CreateBonusPoolInput,
  operatorUserId: string,
) {
  const scoreYearId = normalizeRequiredString(input.scoreYearId);
  const title = normalizeRequiredString(input.title);
  const amount = parsePositiveNumber(input.amount);
  const sourceType = normalizeOptionalString(input.sourceType);
  const description = normalizeOptionalString(input.description);
  const injectedAt = parseDateTime(input.injectedAt) || new Date();

  if (!scoreYearId) {
    return { ok: false as const, status: 400, message: "请选择积分年度" };
  }

  if (!title) {
    return { ok: false as const, status: 400, message: "请填写奖金池标题" };
  }

  if (amount === null || amount <= 0) {
    return { ok: false as const, status: 400, message: "奖金池金额必须大于 0" };
  }

  const scoreYear = await prisma.scoreYear.findUnique({
    where: { id: scoreYearId },
    select: { id: true },
  });

  if (!scoreYear) {
    return { ok: false as const, status: 400, message: "积分年度不存在" };
  }

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.bonusPool.create({
      data: {
        scoreYearId,
        title,
        amount,
        sourceType,
        description,
        injectedAt,
        createdBy: operatorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "BONUS_POOL_INJECTED",
        targetType: "BonusPool",
        targetId: created.id,
        afterJson: JSON.stringify({
          scoreYearId,
          amount,
          title,
          sourceType,
          operatorUserId,
        }),
      },
    });

    return created;
  });

  return { ok: true as const, entry };
}

export async function calculateBonusSettlement(scoreYearId: string) {
  const scoreYear = await prisma.scoreYear.findUnique({
    where: { id: scoreYearId },
    select: { id: true, name: true, status: true },
  });

  if (!scoreYear) {
    return { ok: false as const, status: 404, message: "积分年度不存在" };
  }

  const [poolSummary, ranking] = await Promise.all([
    getBonusPoolSummary(scoreYearId),
    getAdminScoreRanking({ scoreYearId, limit: "all" }),
  ]);
  const totalPoolAmount = poolSummary.totalAmount;
  const rankedLeaderIds = new Set(ranking.allRows.map((row) => row.leader.id));
  const inactiveLeaders = await prisma.leader.findMany({
    where: rankedLeaderIds.size > 0 ? { id: { notIn: Array.from(rankedLeaderIds) } } : {},
    orderBy: { realName: "asc" },
    select: {
      id: true,
      realName: true,
      nickname: true,
      status: true,
      level: true,
    },
  });
  const baseItems = [
    ...ranking.allRows.map(mapRankingRowToBonusItem),
    ...inactiveLeaders.map(mapInactiveLeaderToBonusItem),
  ]
    .sort(compareBonusItems)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  const eligibleItems = baseItems.filter((item) => item.eligible);
  const totalEligiblePoints = roundPoints(
    eligibleItems.reduce((sum, item) => sum + item.totalPoints, 0),
  );
  const items = baseItems.map((item) => {
    if (!item.eligible || totalEligiblePoints <= 0 || totalPoolAmount <= 0) {
      return {
        ...item,
        pointShare: 0,
        calculatedAmount: 0,
        cappedAmount: 0,
        finalAmount: 0,
      };
    }

    const pointShare = item.totalPoints / totalEligiblePoints;
    const calculatedAmount = roundMoney(totalPoolAmount * pointShare);
    const finalAmount = roundMoney(Math.min(calculatedAmount, BONUS_CAP_AMOUNT));

    return {
      ...item,
      pointShare: roundRatio(pointShare),
      calculatedAmount,
      cappedAmount: roundMoney(Math.max(calculatedAmount - finalAmount, 0)),
      finalAmount,
    };
  });
  const totalCalculatedAmount = roundMoney(
    items.reduce((sum, item) => sum + item.calculatedAmount, 0),
  );
  const totalFinalAmount = roundMoney(items.reduce((sum, item) => sum + item.finalAmount, 0));
  const totalCappedAmount = roundMoney(items.reduce((sum, item) => sum + item.cappedAmount, 0));

  return {
    ok: true as const,
    preview: {
      scoreYearId,
      scoreYearName: scoreYear.name,
      totalPoolAmount,
      eligibleLeaderCount: eligibleItems.length,
      totalEffectivePoints: roundPoints(baseItems.reduce((sum, item) => sum + item.totalPoints, 0)),
      totalEligiblePoints,
      totalCalculatedAmount,
      totalFinalAmount,
      totalCappedAmount,
      undistributedAmount: roundMoney(Math.max(totalPoolAmount - totalFinalAmount, 0)),
      capAmount: BONUS_CAP_AMOUNT,
      items,
    } satisfies BonusSettlementPreview,
  };
}

export async function saveBonusSettlement(
  input: SaveBonusSettlementInput,
  operatorUserId: string,
) {
  const scoreYearId = normalizeRequiredString(input.scoreYearId);
  const title = normalizeRequiredString(input.title);
  const remark = normalizeOptionalString(input.remark);

  if (!scoreYearId) {
    return { ok: false as const, status: 400, message: "请选择积分年度" };
  }

  if (!title) {
    return { ok: false as const, status: 400, message: "请填写测算标题" };
  }

  const result = await calculateBonusSettlement(scoreYearId);

  if (!result.ok) {
    return result;
  }

  const { preview } = result;
  const settlement = await prisma.$transaction(async (tx) => {
    const created = await tx.bonusSettlement.create({
      data: {
        scoreYearId,
        title,
        totalPoolAmount: preview.totalPoolAmount,
        eligibleLeaderCount: preview.eligibleLeaderCount,
        totalEligiblePoints: preview.totalEligiblePoints,
        totalCalculatedAmount: preview.totalCalculatedAmount,
        totalFinalAmount: preview.totalFinalAmount,
        totalCappedAmount: preview.totalCappedAmount,
        undistributedAmount: preview.undistributedAmount,
        status: "DRAFT",
        remark,
        createdBy: operatorUserId,
        items: {
          create: preview.items.map((item) => ({
            leaderId: item.leaderId,
            rank: item.rank,
            totalPoints: item.totalPoints,
            baseTripPoints: item.baseTripPoints,
            applicationPoints: item.applicationPoints,
            deductPoints: item.deductPoints,
            tripCount: item.tripCount,
            tripDays: item.tripDays,
            eligible: item.eligible,
            ineligibleReason: item.ineligibleReason,
            pointShare: item.pointShare,
            calculatedAmount: item.calculatedAmount,
            cappedAmount: item.cappedAmount,
            finalAmount: item.finalAmount,
          })),
        },
      },
      include: { items: true },
    });

    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "BONUS_SETTLEMENT_SAVED",
        targetType: "BonusSettlement",
        targetId: created.id,
        afterJson: JSON.stringify({
          scoreYearId,
          settlementId: created.id,
          totalPoolAmount: preview.totalPoolAmount,
          eligibleLeaderCount: preview.eligibleLeaderCount,
          totalEligiblePoints: preview.totalEligiblePoints,
          totalFinalAmount: preview.totalFinalAmount,
          operatorUserId,
        }),
      },
    });

    return created;
  });

  return { ok: true as const, settlement, preview };
}

export async function getBonusSettlements(scoreYearId?: string) {
  return prisma.bonusSettlement.findMany({
    where: scoreYearId ? { scoreYearId } : {},
    orderBy: { createdAt: "desc" },
    include: {
      scoreYear: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  });
}

export async function getBonusSettlementDetail(id: string) {
  return prisma.bonusSettlement.findUnique({
    where: { id },
    include: {
      scoreYear: { select: { id: true, name: true } },
      items: {
        orderBy: { rank: "asc" },
        include: {
          leader: {
            select: {
              id: true,
              realName: true,
              nickname: true,
              status: true,
              level: true,
            },
          },
        },
      },
    },
  });
}

export function formatMoney(value: number) {
  return `¥${value.toFixed(2)}`;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export { formatRankingPoints };

function mapRankingRowToBonusItem(row: ScoreRankingRow): BonusSettlementItemPreview {
  const ineligibleReason = getIneligibleReason(row);

  return {
    leaderId: row.leader.id,
    leaderName: row.leader.realName,
    nickname: row.leader.nickname,
    leaderStatus: row.leader.status,
    level: row.leader.level,
    rank: row.rank,
    totalPoints: row.totalPoints,
    baseTripPoints: row.baseTripPoints,
    applicationPoints: row.applicationPoints,
    deductPoints: row.deductPoints,
    tripCount: row.tripCount,
    tripDays: row.tripDays,
    eligible: !ineligibleReason,
    ineligibleReason,
    pointShare: 0,
    calculatedAmount: 0,
    cappedAmount: 0,
    finalAmount: 0,
  };
}

function mapInactiveLeaderToBonusItem(leader: BonusLeaderSnapshot): BonusSettlementItemPreview {
  const ineligibleReason = getIneligibleReason({
    leader: { status: leader.status },
    tripCount: 0,
    totalPoints: 0,
  });

  return {
    leaderId: leader.id,
    leaderName: leader.realName,
    nickname: leader.nickname,
    leaderStatus: leader.status,
    level: leader.level,
    rank: 0,
    totalPoints: 0,
    baseTripPoints: 0,
    applicationPoints: 0,
    deductPoints: 0,
    tripCount: 0,
    tripDays: 0,
    eligible: false,
    ineligibleReason,
    pointShare: 0,
    calculatedAmount: 0,
    cappedAmount: 0,
    finalAmount: 0,
  };
}

function compareBonusItems(a: BonusSettlementItemPreview, b: BonusSettlementItemPreview) {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  if (b.tripCount !== a.tripCount) return b.tripCount - a.tripCount;
  if (b.tripDays !== a.tripDays) return b.tripDays - a.tripDays;
  return a.leaderName.localeCompare(b.leaderName, "zh-Hans-CN");
}

function getIneligibleReason(row: {
  leader: { status: string };
  tripCount: number;
  totalPoints: number;
}) {
  if (row.leader.status === "LEFT") return "队长已离职";
  if (row.leader.status === "SUSPENDED") return "队长已暂停";
  if (row.tripCount < BONUS_TRIP_COUNT_THRESHOLD) return "年度带队次数不足 8 次";
  if (row.totalPoints <= 0) return "年度有效积分不大于 0";
  return null;
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

function roundPoints(value: number) {
  return Math.round(value * 100) / 100;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundRatio(value: number) {
  return Math.round(value * 10000) / 10000;
}
