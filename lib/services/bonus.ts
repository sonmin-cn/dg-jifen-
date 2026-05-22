import { prisma } from "@/lib/db/prisma";
import {
  formatRankingPoints,
  getAdminScoreRanking,
  type ScoreRankingRow,
} from "@/lib/services/score-ranking";
import {
  getBonusRuleSnapshot,
  type BonusDistributionTier,
  type BonusRuleConfig,
} from "@/lib/constants/bonus";

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
  bonusEffectivePoints: number;
  tierName: string | null;
  tierWeight: number;
  weightedPoints: number;
  eligible: boolean;
  ineligibleReason: string | null;
  participatesInDistribution: boolean;
  disqualifiedBySeriousComplaint: boolean;
  disqualifiedByFakeBehavior: boolean;
  disqualifiedByRedline: boolean;
  complaintCount: number;
  safetyViolationCount: number;
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
  totalWeightedPoints: number;
  totalCalculatedAmount: number;
  totalFinalAmount: number;
  totalCappedAmount: number;
  undistributedAmount: number;
  capAmount: number;
  ruleConfig: BonusRuleConfig;
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
    select: { id: true, name: true, status: true, startDate: true, endDate: true },
  });

  if (!scoreYear) {
    return { ok: false as const, status: 404, message: "积分年度不存在" };
  }

  const ruleConfig = getBonusRuleSnapshot();
  const [poolSummary, ranking, violationFlags] = await Promise.all([
    getBonusPoolSummary(scoreYearId),
    getAdminScoreRanking({ scoreYearId, limit: "all" }),
    getBonusViolationFlags(scoreYearId),
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
    ...ranking.allRows.map((row) =>
      mapRankingRowToBonusItem(row, ruleConfig, violationFlags),
    ),
    ...inactiveLeaders.map((leader) =>
      mapInactiveLeaderToBonusItem(leader, ruleConfig, violationFlags),
    ),
  ]
    .sort(compareBonusItems)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  const eligibleItems = baseItems.filter((item) => item.participatesInDistribution);
  const tieredItems = assignBonusTiers(eligibleItems, ruleConfig.tiers);
  const tieredItemByLeaderId = new Map(
    tieredItems.map((item) => [item.leaderId, item]),
  );
  const totalEligiblePoints = roundPoints(
    eligibleItems.reduce((sum, item) => sum + item.bonusEffectivePoints, 0),
  );
  const totalWeightedPoints = roundPoints(
    tieredItems.reduce((sum, item) => sum + item.weightedPoints, 0),
  );
  const items = baseItems.map((item) => {
    const tieredItem = tieredItemByLeaderId.get(item.leaderId);
    const enrichedItem = tieredItem || item;

    if (
      !enrichedItem.participatesInDistribution ||
      totalWeightedPoints <= 0 ||
      totalPoolAmount <= 0
    ) {
      return {
        ...enrichedItem,
        pointShare: 0,
        calculatedAmount: 0,
        cappedAmount: 0,
        finalAmount: 0,
      };
    }

    const pointShare = enrichedItem.weightedPoints / totalWeightedPoints;
    const calculatedAmount = roundMoney(totalPoolAmount * pointShare);
    const finalAmount = roundMoney(Math.min(calculatedAmount, ruleConfig.singleLeaderCap));

    return {
      ...enrichedItem,
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
      totalWeightedPoints,
      totalCalculatedAmount,
      totalFinalAmount,
      totalCappedAmount,
      undistributedAmount: roundMoney(Math.max(totalPoolAmount - totalFinalAmount, 0)),
      capAmount: ruleConfig.singleLeaderCap,
      ruleConfig,
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
  const ruleSnapshotText = `奖金规则快照：${JSON.stringify(preview.ruleConfig)}`;
  const savedRemark = remark ? `${remark}\n${ruleSnapshotText}` : ruleSnapshotText;
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
        remark: savedRemark,
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
          totalWeightedPoints: preview.totalWeightedPoints,
          totalFinalAmount: preview.totalFinalAmount,
          ruleConfig: preview.ruleConfig,
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

function mapRankingRowToBonusItem(
  row: ScoreRankingRow,
  ruleConfig: BonusRuleConfig,
  violationFlags: Map<string, BonusViolationFlags>,
): BonusSettlementItemPreview {
  const flags = violationFlags.get(row.leader.id);
  const bonusEffectivePoints =
    (flags?.hasRedline && ruleConfig.redlineClearsPoints) ||
    (flags?.hasFakeBehavior && ruleConfig.fakeBehaviorClearsPoints) ||
    (flags?.hasSeriousComplaint && ruleConfig.seriousComplaintClearsPoints)
      ? 0
      : row.totalPoints;
  const ineligibleReason = getIneligibleReason({
    leader: row.leader,
    tripCount: row.tripCount,
    bonusEffectivePoints,
    hasSeriousComplaint: Boolean(flags?.hasSeriousComplaint),
    hasFakeBehavior: Boolean(flags?.hasFakeBehavior),
    hasRedline: Boolean(flags?.hasRedline),
    complaintCount: flags?.validComplaintCount || 0,
    safetyViolationCount: flags?.safetyViolationCount || 0,
    ruleConfig,
  });

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
    bonusEffectivePoints,
    tierName: null,
    tierWeight: 0,
    weightedPoints: 0,
    eligible: !ineligibleReason,
    ineligibleReason,
    participatesInDistribution: !ineligibleReason,
    disqualifiedBySeriousComplaint:
      Boolean(flags?.hasSeriousComplaint) && ruleConfig.disqualifySeriousComplaint,
    disqualifiedByFakeBehavior:
      Boolean(flags?.hasFakeBehavior) && ruleConfig.disqualifyFakeBehavior,
    disqualifiedByRedline: Boolean(flags?.hasRedline) && ruleConfig.disqualifyRedline,
    complaintCount: flags?.validComplaintCount || 0,
    safetyViolationCount: flags?.safetyViolationCount || 0,
    pointShare: 0,
    calculatedAmount: 0,
    cappedAmount: 0,
    finalAmount: 0,
  };
}

function mapInactiveLeaderToBonusItem(
  leader: BonusLeaderSnapshot,
  ruleConfig: BonusRuleConfig,
  violationFlags: Map<string, BonusViolationFlags>,
): BonusSettlementItemPreview {
  const flags = violationFlags.get(leader.id);
  const ineligibleReason = getIneligibleReason({
    leader: { status: leader.status },
    tripCount: 0,
    bonusEffectivePoints: 0,
    hasSeriousComplaint: Boolean(flags?.hasSeriousComplaint),
    hasFakeBehavior: Boolean(flags?.hasFakeBehavior),
    hasRedline: Boolean(flags?.hasRedline),
    complaintCount: flags?.validComplaintCount || 0,
    safetyViolationCount: flags?.safetyViolationCount || 0,
    ruleConfig,
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
    bonusEffectivePoints: 0,
    tierName: null,
    tierWeight: 0,
    weightedPoints: 0,
    eligible: false,
    ineligibleReason,
    participatesInDistribution: false,
    disqualifiedBySeriousComplaint:
      Boolean(flags?.hasSeriousComplaint) && ruleConfig.disqualifySeriousComplaint,
    disqualifiedByFakeBehavior:
      Boolean(flags?.hasFakeBehavior) && ruleConfig.disqualifyFakeBehavior,
    disqualifiedByRedline: Boolean(flags?.hasRedline) && ruleConfig.disqualifyRedline,
    complaintCount: flags?.validComplaintCount || 0,
    safetyViolationCount: flags?.safetyViolationCount || 0,
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
  bonusEffectivePoints: number;
  hasSeriousComplaint: boolean;
  hasFakeBehavior: boolean;
  hasRedline: boolean;
  complaintCount: number;
  safetyViolationCount: number;
  ruleConfig: BonusRuleConfig;
}) {
  if (row.leader.status === "LEFT") return "队长已离职";
  if (row.leader.status === "SUSPENDED") return "队长已暂停";
  if (row.leader.status === "INTERN" && !row.ruleConfig.includeInternLeaders) {
    return "实习队长暂不参与";
  }
  if (row.hasRedline && row.ruleConfig.disqualifyRedline) return "红线行为取消资格";
  if (row.hasFakeBehavior && row.ruleConfig.disqualifyFakeBehavior) return "虚假行为取消资格";
  if (row.hasSeriousComplaint && row.ruleConfig.disqualifySeriousComplaint) {
    return "严重投诉取消资格";
  }
  if (row.complaintCount >= row.ruleConfig.disqualifyValidComplaintCount) {
    return `有效投诉累计 ${row.complaintCount} 次取消资格`;
  }
  if (row.safetyViolationCount >= row.ruleConfig.disqualifySafetyViolationCount) {
    return `安全违规累计 ${row.safetyViolationCount} 次取消资格`;
  }
  if (row.tripCount < row.ruleConfig.minTripCount) {
    return `年度带队次数不足 ${row.ruleConfig.minTripCount} 次`;
  }
  if (row.bonusEffectivePoints <= 0) return "奖金测算积分不大于 0";
  return null;
}

type BonusViolationFlags = {
  hasSeriousComplaint: boolean;
  hasFakeBehavior: boolean;
  hasRedline: boolean;
  validComplaintCount: number;
  safetyViolationCount: number;
};

async function getBonusViolationFlags(scoreYearId: string) {
  const [events, scoreRecords] = await Promise.all([
    prisma.violationEvent.findMany({
      where: {
        scoreYearId,
        status: "EFFECTIVE",
        OR: [
          { ruleCode: "SERIOUS_COMPLAINT" },
          { ruleCode: "VALID_COMPLAINT" },
          { ruleCode: "SAFETY_VIOLATION" },
          { ruleCode: "REDLINE" },
          { ruleCode: "FAKE_BEHAVIOR" },
          { type: "COMPLAINT" },
          { type: "SAFETY" },
          { type: "REDLINE" },
          { type: "FAKE_BEHAVIOR" },
        ],
      },
      select: {
        leaderId: true,
        ruleCode: true,
        type: true,
      },
    }),
    prisma.scoreRecord.findMany({
      where: {
        scoreYearId,
        status: "EFFECTIVE",
        OR: [
          { ruleCode: "SERIOUS_COMPLAINT" },
          { ruleCode: "VALID_COMPLAINT" },
          { ruleCode: "SAFETY_VIOLATION" },
          { ruleCode: "REDLINE" },
          { ruleCode: "FAKE_BEHAVIOR" },
          { category: "COMPLAINT" },
          { category: "SAFETY" },
          { category: "REDLINE" },
        ],
      },
      select: {
        leaderId: true,
        ruleCode: true,
        category: true,
      },
    }),
  ]);
  const flags = new Map<string, BonusViolationFlags>();

  for (const event of events) {
    const current = flags.get(event.leaderId) || {
      hasSeriousComplaint: false,
      hasFakeBehavior: false,
      hasRedline: false,
      validComplaintCount: 0,
      safetyViolationCount: 0,
    };
    if (event.ruleCode === "SERIOUS_COMPLAINT") {
      current.hasSeriousComplaint = true;
    }
    if (event.ruleCode === "VALID_COMPLAINT") {
      current.validComplaintCount += 1;
    }
    if (event.ruleCode === "SAFETY_VIOLATION" || event.type === "SAFETY") {
      current.safetyViolationCount += 1;
    }
    if (event.ruleCode === "FAKE_BEHAVIOR" || event.type === "FAKE_BEHAVIOR") {
      current.hasFakeBehavior = true;
    }
    if (event.ruleCode === "REDLINE" || event.type === "REDLINE") {
      current.hasRedline = true;
    }
    flags.set(event.leaderId, current);
  }

  for (const record of scoreRecords) {
    const current = flags.get(record.leaderId) || {
      hasSeriousComplaint: false,
      hasFakeBehavior: false,
      hasRedline: false,
      validComplaintCount: 0,
      safetyViolationCount: 0,
    };
    if (record.ruleCode === "SERIOUS_COMPLAINT") {
      current.hasSeriousComplaint = true;
    }
    if (record.ruleCode === "VALID_COMPLAINT") {
      current.validComplaintCount += 1;
    }
    if (record.ruleCode === "SAFETY_VIOLATION" || record.category === "SAFETY") {
      current.safetyViolationCount += 1;
    }
    if (record.ruleCode === "FAKE_BEHAVIOR") {
      current.hasFakeBehavior = true;
    }
    if (
      record.ruleCode === "REDLINE" ||
      (record.category === "REDLINE" && record.ruleCode !== "FAKE_BEHAVIOR")
    ) {
      current.hasRedline = true;
    }
    flags.set(record.leaderId, current);
  }

  return flags;
}

function assignBonusTiers(
  items: BonusSettlementItemPreview[],
  tiers: BonusDistributionTier[],
) {
  const sortedItems = [...items].sort(compareBonusItems);
  const total = sortedItems.length;

  return sortedItems.map((item, index) => {
    const rank = index + 1;
    const tier = findTierByRank(rank, total, tiers);
    const weightedPoints = roundPoints(item.bonusEffectivePoints * tier.weight);

    return {
      ...item,
      tierName: tier.name,
      tierWeight: tier.weight,
      weightedPoints,
    };
  });
}

function findTierByRank(rank: number, total: number, tiers: BonusDistributionTier[]) {
  for (const tier of tiers) {
    const upperBound = Math.ceil(total * (tier.toPercent / 100));
    if (rank <= upperBound) return tier;
  }

  return tiers[tiers.length - 1] || { name: "默认档", fromPercent: 0, toPercent: 100, weight: 1 };
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
