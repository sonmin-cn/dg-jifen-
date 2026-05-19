import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { generateBaseScoresForTrips } from "@/lib/services/base-score";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/batch-generate-base-score",
      { mode: "throw" },
    );
    const body = (await request.json().catch(() => null)) as {
      tripIds?: unknown;
      scope?: unknown;
    } | null;
    const tripIds = Array.isArray(body?.tripIds)
      ? body.tripIds.filter((id): id is string => typeof id === "string")
      : [];

    if (tripIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "请选择需要生成基础积分的团期" },
        { status: 400 },
      );
    }

    const result = await generateBaseScoresForTrips({
      tripIds,
      operatorUserId: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
