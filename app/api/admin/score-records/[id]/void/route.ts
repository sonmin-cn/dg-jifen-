import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { SCORE_RECORD_VOID_ROLES } from "@/lib/auth/roles";
import { voidScoreRecord } from "@/lib/services/score-records";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(SCORE_RECORD_VOID_ROLES, "/api/admin/score-records/:id/void", {
      mode: "throw",
    });
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const result = await voidScoreRecord(id, user.id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: "积分记录已作废",
      scoreRecordId: result.record.id,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
