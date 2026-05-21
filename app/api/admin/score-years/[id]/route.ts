import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { SCORE_YEAR_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { updateScoreYear } from "@/lib/services/score-years";

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

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      SCORE_YEAR_MANAGEMENT_ROLES,
      "/api/admin/score-years/:id",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const result = await updateScoreYear(id, user.id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: "积分年度已更新",
      scoreYearId: result.scoreYear.id,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
