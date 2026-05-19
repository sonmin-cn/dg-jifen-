import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { calculateBaseTripPoints } from "@/lib/rules/score";
import {
  buildRuleSnapshot,
  getActiveScoreRule,
} from "@/lib/services/score-rules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

function parseRuleConfig(configJson: string | null) {
  if (!configJson) {
    return getDefaultBaseTripConfig();
  }

  try {
    const parsed = JSON.parse(configJson) as Record<string, unknown>;
    return {
      formula:
        typeof parsed.formula === "string"
          ? parsed.formula
          : "perTripPoints + actualWorkDays * perDayPoints",
      perTripPoints: normalizeConfigNumber(parsed.perTripPoints, 1),
      perDayPoints: normalizeConfigNumber(parsed.perDayPoints, 1),
    };
  } catch {
    return getDefaultBaseTripConfig();
  }
}

function getDefaultBaseTripConfig() {
  return {
    formula: "perTripPoints + actualWorkDays * perDayPoints",
    perTripPoints: 1,
    perDayPoints: 1,
  };
}

function normalizeConfigNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/:id/generate-base-score",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const now = new Date();
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        tripLeaders: {
          include: {
            leader: {
              select: {
                id: true,
                realName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    async function fail(message: string, status = 400) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "BASE_SCORE_GENERATE_FAILED",
          targetType: "Trip",
          targetId: id,
          afterJson: JSON.stringify({
            tripId: id,
            tripRouteName: trip?.routeName ?? null,
            reason: message,
          }),
        },
      });

      return NextResponse.json({ message }, { status });
    }

    if (!trip) {
      return fail("团期不存在", 404);
    }

    if (trip.status === "PLANNED") {
      return fail("仅已完成团期可生成基础积分");
    }

    if (trip.status === "CANCELLED") {
      return fail("取消团不可生成基础积分");
    }

    const occurredAt = trip.endDate || now;
    const [scoreYear, rule] = await Promise.all([
      prisma.scoreYear.findFirst({
        where: {
          status: "ACTIVE",
          startDate: { lte: occurredAt },
          endDate: { gte: occurredAt },
        },
        orderBy: { startDate: "desc" },
      }),
      getActiveScoreRule({ code: "BASE_TRIP", occurredAt }),
    ]);

    if (!scoreYear) {
      return fail("未找到覆盖该团期结束日期的 ACTIVE 积分年度");
    }

    if (!rule) {
      return fail("未找到 BASE_TRIP 有效积分规则");
    }

    const invalidCompletedTripLeaders = trip.tripLeaders.filter(
      (tripLeader) =>
        tripLeader.isCompleted &&
        !tripLeader.baseScoreRecordId &&
        tripLeader.actualWorkDays <= 0,
    );

    if (invalidCompletedTripLeaders.length > 0) {
      return fail("存在实际带队天数无效的已完成带队记录，请先修正");
    }

    const eligibleTripLeaders = trip.tripLeaders.filter(
      (tripLeader) => tripLeader.isCompleted && tripLeader.actualWorkDays > 0,
    );

    if (eligibleTripLeaders.length === 0) {
      return fail("暂无可生成积分的带队记录");
    }

    const pendingTripLeaders = eligibleTripLeaders.filter(
      (tripLeader) => !tripLeader.baseScoreRecordId,
    );

    if (pendingTripLeaders.length === 0) {
      return fail("基础积分已全部生成");
    }

    const ruleConfig = parseRuleConfig(rule.configJson);
    const ruleSnapshot = buildRuleSnapshot(rule);
    const result = await prisma.$transaction(async (tx) => {
      const scoreRecordIds: string[] = [];
      const generatedLeaderIds: string[] = [];
      let generatedTotalPoints = 0;

      for (const tripLeader of pendingTripLeaders) {
        const points = calculateBaseTripPoints(tripLeader.actualWorkDays, ruleConfig);
        const remark = `基础带队积分：${ruleConfig.perTripPoints}分/团 + ${tripLeader.actualWorkDays}天 × ${ruleConfig.perDayPoints}分/天 = ${points}分`;
        const snapshot = {
          ...ruleSnapshot,
          ...ruleConfig,
          actualWorkDays: tripLeader.actualWorkDays,
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
            approvedBy: user.id,
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

        generatedTotalPoints = Math.round((generatedTotalPoints + points) * 100) / 100;
        generatedLeaderIds.push(tripLeader.leaderId);
        scoreRecordIds.push(scoreRecord.id);
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "BASE_SCORE_GENERATED",
          targetType: "Trip",
          targetId: trip.id,
          afterJson: JSON.stringify({
            tripId: trip.id,
            tripRouteName: trip.routeName,
            generatedCount: pendingTripLeaders.length,
            generatedTotalPoints,
            generatedLeaderIds,
            scoreRecordIds,
          }),
        },
      });

      return {
        generatedCount: pendingTripLeaders.length,
        generatedTotalPoints,
        generatedLeaderIds,
        scoreRecordIds,
      };
    });

    return NextResponse.json({
      message: `已为 ${result.generatedCount} 名队长生成基础积分，共 ${result.generatedTotalPoints} 分`,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
