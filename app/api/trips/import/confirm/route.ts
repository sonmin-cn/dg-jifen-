import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { confirmTripImport } from "@/lib/services/trip-import";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json({ success: false, error: "导入失败，请稍后重试" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(TRIP_MANAGEMENT_ROLES, "/api/trips/import/confirm", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = await confirmTripImport(body || {}, user.id);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      details: result.details,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
