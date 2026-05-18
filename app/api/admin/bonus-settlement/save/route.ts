import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { BONUS_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { saveBonusSettlement } from "@/lib/services/bonus";

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
    const user = await requireRole(BONUS_MANAGEMENT_ROLES, "/api/admin/bonus-settlement/save", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = await saveBonusSettlement(body || {}, user.id);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: "奖金测算结果已保存",
      settlementId: result.settlement.id,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
