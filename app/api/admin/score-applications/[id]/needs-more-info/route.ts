import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { requestMoreInfoScoreApplication } from "@/lib/services/score-applications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      LEADER_MANAGEMENT_ROLES,
      "/api/admin/score-applications/:id/needs-more-info",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const reason = typeof body?.reason === "string" ? body.reason : "";
    const result = await requestMoreInfoScoreApplication(id, user.id, reason);

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({ application: result.application });
  } catch (error) {
    return errorResponse(error);
  }
}
