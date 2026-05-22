import type { Prisma, ScoreRule } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateBaseTripPoints } from "@/lib/rules/score";
import { buildRuleSnapshot } from "@/lib/services/score-rules";

export type BaseScoreGenerateStatus = "generated" | "skipped" | "failed";

export type BaseScoreGenerateDetail = {
  tripId: string;
  routeName: string;
  leaderId?: string;
  leaderName?: string;
  status: BaseScoreGenerateStatus;
  points?: number;
  scoreRecordId?: string;
  reason?: string;
};

export type BaseScoreGenerateSummary = {
  processedTrips: number;
  generatedRecords: number;
  skippedTripLeaders: number;
  failedTrips: number;
  totalPoints: number;
};

export type BaseScoreGenerateResult = {
  success: true;
  summary: BaseScoreGenerateSummary;
  details: BaseScoreGenerateDetail[];
  scoreRecordIds: string[];
};

type BaseTripRuleConfig = {
  formula: string;
  perTripPoints: number;
  perDayPoints: number;
  roundActualWorkDays: "CEIL_TO_DAY" | "NONE";
};

const defaultBaseTripConfig: BaseTripRuleConfig = {
  formula: "perTripPoints + actualWorkDays * perDayPoints",
  perTripPoints: 1,
  perDayPoints: 1,
  roundActualWorkDays: "CEIL_TO_DAY",
};

export function parseBaseTripRuleConfig(configJson: string | null): BaseTripRuleConfig {
  if (!configJson) {
    return defaultBaseTripConfig;
  }

  try {
    const parsed = JSON.parse(configJson) as Record<string, unknown>;
    return {
      formula:
        typeof parsed.formula === "string"
          ? parsed.formula
          : defaultBaseTripConfig.formula,
      perTripPoints: normalizeConfigNumber(
        parsed.perTripPoints,
        defaultBaseTripConfig.perTripPoints,
      ),
      perDayPoints: normalizeConfigNumber(
        parsed.perDayPoints,
        defaultBaseTripConfig.perDayPoints,
      ),
      roundActualWorkDays:
        parsed.roundActualWorkDays === "NONE" ? "NONE" : "CEIL_TO_DAY",
    };
  } catch {
    return defaultBaseTripConfig;
  }
}

export async function generateBaseScoresForTrips({
  tripIds,
  operatorUserId,
}: {
  tripIds: string[];
  operatorUserId: string;
}): Promise<BaseScoreGenerateResult> {
  const uniqueTripIds = [...new Set(tripIds.filter(Boolean))];
  const now = new Date();
  const summary: BaseScoreGenerateSummary = {
    processedTrips: uniqueTripIds.length,
    generatedRecords: 0,
    skippedTripLeaders: 0,
    failedTrips: 0,
    totalPoints: 0,
  };
  const details: BaseScoreGenerateDetail[] = [];
  const scoreRecordIds: string[] = [];

  if (uniqueTripIds.length === 0) {
    return { success: true, summary, details, scoreRecordIds };
  }

  await prisma.$transaction(async (tx) => {
    for (const tripId of uniqueTripIds) {
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: {
          tripLeaders: {
            include: {
              leader: {
                select: {
                  id: true,
                  realName: true,
                  status: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!trip) {
        summary.failedTrips += 1;
        details.push({
          tripId,
          routeName: "-",
          status: "failed",
          reason: "团期不存在",
        });
        continue;
      }

      if (trip.status !== "COMPLETED") {
        summary.failedTrips += 1;
        details.push({
          tripId: trip.id,
          routeName: trip.routeName,
          status: "failed",
          reason:
            trip.status === "CANCELLED"
              ? "取消团不可生成基础积分"
              : "仅已完成团期可生成基础积分",
        });
        continue;
      }

      const occurredAt = trip.endDate || now;
      const [scoreYear, rule] = await Promise.all([
        tx.scoreYear.findFirst({
          where: {
            status: "ACTIVE",
            startDate: { lte: occurredAt },
            endDate: { gte: occurredAt },
          },
          orderBy: { startDate: "desc" },
        }),
        getActiveBaseTripRule(tx, occurredAt),
      ]);

      if (!scoreYear) {
        const occurredAtText = formatDate(occurredAt);
        summary.failedTrips += 1;
        details.push({
          tripId: trip.id,
          routeName: trip.routeName,
          status: "failed",
          reason: `未找到覆盖 ${occurredAtText} 的 ACTIVE 积分年度，请先在积分年度管理中新增或启用覆盖该日期的积分年度。前往 /admin/score-years`,
        });
        continue;
      }

      if (!rule) {
        summary.failedTrips += 1;
        details.push({
          tripId: trip.id,
          routeName: trip.routeName,
          status: "failed",
          reason: "未找到 BASE_TRIP 有效积分规则",
        });
        continue;
      }

      const ruleConfig = parseBaseTripRuleConfig(rule.configJson);
      const ruleSnapshot = buildRuleSnapshot(rule);
      let tripGeneratedCount = 0;

      for (const tripLeader of trip.tripLeaders) {
        const leaderName = tripLeader.leader.realName;

        if (!tripLeader.isCompleted) {
          summary.skippedTripLeaders += 1;
          details.push({
            tripId: trip.id,
            routeName: trip.routeName,
            leaderId: tripLeader.leaderId,
            leaderName,
            status: "skipped",
            reason: "带队记录未标记完成",
          });
          continue;
        }

        if (!["INTERN", "REGULAR"].includes(tripLeader.leader.status)) {
          summary.skippedTripLeaders += 1;
          details.push({
            tripId: trip.id,
            routeName: trip.routeName,
            leaderId: tripLeader.leaderId,
            leaderName,
            status: "skipped",
            reason: "队长状态不是实习或正式",
          });
          continue;
        }

        if (tripLeader.actualWorkDays <= 0) {
          summary.skippedTripLeaders += 1;
          details.push({
            tripId: trip.id,
            routeName: trip.routeName,
            leaderId: tripLeader.leaderId,
            leaderName,
            status: "skipped",
            reason: "实际带队天数无效",
          });
          continue;
        }

        if (tripLeader.baseScoreRecordId) {
          summary.skippedTripLeaders += 1;
          details.push({
            tripId: trip.id,
            routeName: trip.routeName,
            leaderId: tripLeader.leaderId,
            leaderName,
            status: "skipped",
            reason: "已生成基础积分",
          });
          continue;
        }

        const effectiveWorkDays =
          ruleConfig.roundActualWorkDays === "CEIL_TO_DAY"
            ? Math.ceil(tripLeader.actualWorkDays)
            : tripLeader.actualWorkDays;
        const points = calculateBaseTripPoints(tripLeader.actualWorkDays, ruleConfig);
        const remark = `基础带队积分：${ruleConfig.perTripPoints}分/团 + ${effectiveWorkDays}天 × ${ruleConfig.perDayPoints}分/天 = ${points}分`;
        const snapshot = {
          ...ruleSnapshot,
          ...ruleConfig,
          actualWorkDays: tripLeader.actualWorkDays,
          effectiveWorkDays,
          calculatedPoints: points,
        };
        const scoreRecord = await tx.scoreRecord.create({
          data: {
            scoreYearId: scoreYear.id,
            leaderId: tripLeader.leaderId,
            tripId: trip.id,
            applicationId: null,
            violationEventId: null,
            ruleId: rule.id,
            ruleCode: rule.code,
            ruleName: rule.name,
            ruleVersion: rule.version,
            rulePoints: points,
            ruleSnapshotJson: JSON.stringify(snapshot),
            sourceType: "TRIP_LEADER",
            sourceId: tripLeader.id,
            category: "BASE_TRIP",
            item: "基础带队积分",
            direction: "ADD",
            rawPoints: points,
            effectivePoints: points,
            status: "EFFECTIVE",
            occurredAt,
            approvedBy: operatorUserId,
            approvedAt: now,
            remark,
          },
        });

        await tx.tripLeader.update({
          where: { id: tripLeader.id },
          data: {
            baseScoreGeneratedAt: now,
            baseScoreRecordId: scoreRecord.id,
          },
        });

        tripGeneratedCount += 1;
        summary.generatedRecords += 1;
        summary.totalPoints = roundPoints(summary.totalPoints + points);
        scoreRecordIds.push(scoreRecord.id);
        details.push({
          tripId: trip.id,
          routeName: trip.routeName,
          leaderId: tripLeader.leaderId,
          leaderName,
          status: "generated",
          points,
          scoreRecordId: scoreRecord.id,
        });
      }

      if (trip.tripLeaders.length === 0) {
        details.push({
          tripId: trip.id,
          routeName: trip.routeName,
          status: "skipped",
          reason: "暂无带队记录",
        });
      } else if (tripGeneratedCount === 0) {
        details.push({
          tripId: trip.id,
          routeName: trip.routeName,
          status: "skipped",
          reason: "该团期没有新增基础积分",
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: operatorUserId,
        action:
          uniqueTripIds.length > 1
            ? "BASE_SCORE_BATCH_GENERATED"
            : "BASE_SCORE_GENERATED",
        targetType: uniqueTripIds.length > 1 ? "TripBatch" : "Trip",
        targetId:
          uniqueTripIds.length > 1
            ? `base-score-batch-${now.getTime()}`
            : uniqueTripIds[0],
        afterJson: JSON.stringify({
          summary,
          details,
          scoreRecordIds,
        }),
      },
    });
  });

  return { success: true, summary, details, scoreRecordIds };
}

async function getActiveBaseTripRule(
  tx: Prisma.TransactionClient,
  occurredAt: Date,
): Promise<ScoreRule | null> {
  return tx.scoreRule.findFirst({
    where: {
      code: "BASE_TRIP",
      isActive: true,
      effectiveFrom: { lte: occurredAt },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: occurredAt } }],
    },
    orderBy: [{ version: "desc" }, { effectiveFrom: "desc" }],
  });
}

function normalizeConfigNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundPoints(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
