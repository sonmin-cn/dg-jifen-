import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { applyLeaderImportRows } from "@/lib/services/leader-import";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ message: "确认导入失败" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(
      LEADER_MANAGEMENT_ROLES,
      "/api/leaders/import/confirm",
      { mode: "throw" },
    );
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json({ message: "缺少导入预览数据" }, { status: 400 });
    }

    const summary = await applyLeaderImportRows(body.rows, { userId: user.id });

    return NextResponse.json({ summary });
  } catch (error) {
    return errorResponse(error);
  }
}
