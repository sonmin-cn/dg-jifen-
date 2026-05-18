import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { BONUS_READ_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { calculateBonusSettlement } from "@/lib/services/bonus";

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
    const user = await requireRole(BONUS_READ_ROLES, "/api/admin/bonus-settlement/preview", {
      mode: "throw",
    });
    const body = (await request.json().catch(() => null)) as { scoreYearId?: string } | null;
    const result = await calculateBonusSettlement(body?.scoreYearId || "");

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    await writeAuditLog({
      userId: user.id,
      action: "BONUS_SETTLEMENT_PREVIEWED",
      targetType: "BonusSettlement",
      targetId: body?.scoreYearId || result.preview.scoreYearId,
      after: {
        scoreYearId: result.preview.scoreYearId,
        totalPoolAmount: result.preview.totalPoolAmount,
        eligibleLeaderCount: result.preview.eligibleLeaderCount,
        totalEligiblePoints: result.preview.totalEligiblePoints,
        totalFinalAmount: result.preview.totalFinalAmount,
      },
    });

    return NextResponse.json({ success: true, ...result.preview });
  } catch (error) {
    return errorResponse(error);
  }
}
