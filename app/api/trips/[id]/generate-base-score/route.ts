import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { generateBaseScoresForTrips } from "@/lib/services/base-score";

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

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/:id/generate-base-score",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const result = await generateBaseScoresForTrips({
      tripIds: [id],
      operatorUserId: user.id,
    });

    if (result.summary.generatedRecords === 0) {
      const firstIssue = result.details.find(
        (detail) => detail.status === "failed" || detail.status === "skipped",
      );

      return NextResponse.json(
        { message: firstIssue?.reason || "暂无可生成积分的带队记录", ...result },
        { status: firstIssue?.reason === "团期不存在" ? 404 : 400 },
      );
    }

    return NextResponse.json({
      message: `已为 ${result.summary.generatedRecords} 名队长生成基础积分，共 ${result.summary.totalPoints} 分`,
      generatedCount: result.summary.generatedRecords,
      generatedTotalPoints: result.summary.totalPoints,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
