import { NextRequest, NextResponse } from "next/server";
import { LeaderBindRequestStatus } from "@prisma/client";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "审核拒绝失败" }, { status: 500 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const reviewer = await requireRole(
      LEADER_MANAGEMENT_ROLES,
      "/api/leader-bind-requests/:id/reject",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const rejectReason =
      typeof body?.rejectReason === "string" ? body.rejectReason.trim() : "";

    if (!rejectReason) {
      return NextResponse.json({ message: "请填写拒绝原因" }, { status: 400 });
    }

    const existing = await prisma.leaderBindRequest.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, leaderId: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "绑定申请不存在" }, { status: 404 });
    }

    if (existing.status !== LeaderBindRequestStatus.PENDING) {
      return NextResponse.json({ message: "只能审核待处理申请" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.leaderBindRequest.update({
        where: { id },
        data: {
          status: LeaderBindRequestStatus.REJECTED,
          rejectReason,
          reviewedBy: reviewer.id,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: reviewer.id,
          action: "LEADER_BIND_REJECTED",
          targetType: "LeaderBindRequest",
          targetId: id,
          afterJson: JSON.stringify(updated),
        },
      });
    });

    return NextResponse.json({ message: "已拒绝申请" });
  } catch (error) {
    return errorResponse(error);
  }
}
