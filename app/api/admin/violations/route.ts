import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { VIOLATION_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { createViolationEvent } from "@/lib/services/violations";

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
    const user = await requireRole(VIOLATION_MANAGEMENT_ROLES, "/api/admin/violations", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = await createViolationEvent(user.id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "扣分事件已创建",
        violationEventId: result.event.id,
        scoreRecordId: result.scoreRecord.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
