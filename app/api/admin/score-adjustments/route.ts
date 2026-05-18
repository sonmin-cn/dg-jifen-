import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { SCORE_ADJUSTMENT_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { createScoreAdjustment } from "@/lib/services/score-adjustments";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(
      SCORE_ADJUSTMENT_MANAGEMENT_ROLES,
      "/api/admin/score-adjustments",
      { mode: "throw" },
    );
    const body = await request.json().catch(() => null);
    const result = await createScoreAdjustment(user.id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "专项加分已创建",
        scoreRecordId: result.scoreRecord.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
