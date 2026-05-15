import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import {
  createLeaderScoreApplication,
  getLeaderApplications,
} from "@/lib/services/score-applications";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

export async function GET() {
  try {
    const user = await requireRole(["LEADER"], "/api/leader/applications", {
      mode: "throw",
    });
    const data = await getLeaderApplications(user.id);

    if (!data.leader) {
      return NextResponse.json({ message: "当前账号尚未绑定队长档案" }, { status: 400 });
    }

    return NextResponse.json({ applications: data.applications });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["LEADER"], "/api/leader/applications", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = await createLeaderScoreApplication(user.id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({ application: result.application }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
