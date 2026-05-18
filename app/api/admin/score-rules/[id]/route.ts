import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { SCORE_RULE_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { updateScoreRule } from "@/lib/services/score-rules";

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
    const user = await requireRole(SCORE_RULE_MANAGEMENT_ROLES, "/api/admin/score-rules/:id", {
      mode: "throw",
    });
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const result = await updateScoreRule(id, user.id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({ success: true, message: "积分规则已更新", ruleId: result.rule.id });
  } catch (error) {
    return errorResponse(error);
  }
}
