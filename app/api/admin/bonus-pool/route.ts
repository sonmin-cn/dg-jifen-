import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { BONUS_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { createBonusPoolEntry } from "@/lib/services/bonus";

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
    const user = await requireRole(BONUS_MANAGEMENT_ROLES, "/api/admin/bonus-pool", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = await createBonusPoolEntry(body || {}, user.id);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "奖金池注入成功",
        bonusPoolId: result.entry.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
