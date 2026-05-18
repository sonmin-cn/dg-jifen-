import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { SCORE_RULE_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { createScoreRule } from "@/lib/services/score-rules";

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
    const user = await requireRole(SCORE_RULE_MANAGEMENT_ROLES, "/api/admin/score-rules", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = await createScoreRule(user.id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(
      { success: true, message: "积分规则已创建", ruleId: result.rule.id },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
