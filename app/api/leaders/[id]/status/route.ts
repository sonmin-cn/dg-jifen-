import { NextRequest, NextResponse } from "next/server";
import type { LeaderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import { LEADER_STATUS_OPTIONS } from "@/lib/constants/leaders";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      LEADER_MANAGEMENT_ROLES,
      "/api/leaders/:id/status",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      status?: string;
    } | null;
    const status = body?.status;

    if (!status || !LEADER_STATUS_OPTIONS.includes(status as LeaderStatus)) {
      return NextResponse.json(
        { message: "请选择有效状态", errors: { status: "请选择有效状态" } },
        { status: 400 },
      );
    }
    const nextStatus = status as LeaderStatus;

    const before = await prisma.leader.findUnique({
      where: { id },
      select: leaderDetailSelect,
    });

    if (!before) {
      return NextResponse.json({ message: "队长不存在" }, { status: 404 });
    }

    const leader = await prisma.leader.update({
      where: { id },
      data: { status: nextStatus },
      select: leaderDetailSelect,
    });

    await writeAuditLog({
      userId: user.id,
      action:
        nextStatus === "LEFT" || nextStatus === "SUSPENDED"
          ? "LEADER_DEACTIVATED"
          : "LEADER_STATUS_UPDATED",
      targetType: "Leader",
      targetId: id,
      before,
      after: leader,
    });

    return NextResponse.json({ leader });
  } catch (error) {
    return errorResponse(error);
  }
}
