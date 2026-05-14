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
  return NextResponse.json({ message: "审核通过失败" }, { status: 500 });
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const reviewer = await requireRole(
      LEADER_MANAGEMENT_ROLES,
      "/api/leader-bind-requests/:id/approve",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const request = await prisma.leaderBindRequest.findUnique({
      where: { id },
      include: {
        user: { include: { leader: true } },
        leader: true,
      },
    });

    if (!request) {
      return NextResponse.json({ message: "绑定申请不存在" }, { status: 404 });
    }
    if (request.status !== LeaderBindRequestStatus.PENDING) {
      return NextResponse.json({ message: "只能审核待处理申请" }, { status: 400 });
    }
    if (request.leader.userId) {
      return NextResponse.json({ message: "该队长档案已绑定账号" }, { status: 409 });
    }
    if (request.user.leader) {
      return NextResponse.json({ message: "该用户已绑定其他队长档案" }, { status: 409 });
    }
    if (request.user.phone !== request.leader.phone) {
      return NextResponse.json({ message: "用户手机号与队长档案手机号不一致" }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.leader.update({
        where: { id: request.leaderId },
        data: { userId: request.userId },
      });
      await tx.leaderBindRequest.update({
        where: { id },
        data: {
          status: LeaderBindRequestStatus.APPROVED,
          reviewedBy: reviewer.id,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: reviewer.id,
          action: "LEADER_BIND_APPROVED",
          targetType: "LeaderBindRequest",
          targetId: id,
          afterJson: JSON.stringify({
            userId: request.userId,
            leaderId: request.leaderId,
          }),
        },
      });
    });

    return NextResponse.json({ message: "已审核通过" });
  } catch (error) {
    return errorResponse(error);
  }
}
