import { NextRequest, NextResponse } from "next/server";
import { LeaderBindRequestStatus } from "@prisma/client";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "查询绑定申请失败" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(LEADER_MANAGEMENT_ROLES, "/api/leader-bind-requests", {
      mode: "throw",
    });
    const status = request.nextUrl.searchParams.get("status") || "";
    const where =
      status &&
      Object.values(LeaderBindRequestStatus).includes(
        status as LeaderBindRequestStatus,
      )
        ? { status: status as LeaderBindRequestStatus }
        : {};

    const requests = await prisma.leaderBindRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            phone: true,
          },
        },
        leader: {
          select: {
            id: true,
            realName: true,
            nickname: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return errorResponse(error);
  }
}
