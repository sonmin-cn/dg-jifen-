import { NextResponse } from "next/server";
import { LeaderBindRequestStatus } from "@prisma/client";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "提交绑定申请失败" }, { status: 500 });
}

export async function POST() {
  try {
    const user = await requireRole(["LEADER"], "/api/leader/bind/request", {
      mode: "throw",
    });
    const [existingBoundLeader, pendingRequest, candidates] = await Promise.all([
      prisma.leader.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
      prisma.leaderBindRequest.findFirst({
        where: {
          userId: user.id,
          status: LeaderBindRequestStatus.PENDING,
        },
        select: { id: true },
      }),
      prisma.leader.findMany({
        where: { phone: user.phone, userId: null },
        select: {
          id: true,
          realName: true,
          phone: true,
        },
      }),
    ]);

    if (existingBoundLeader) {
      return NextResponse.json({ message: "当前账号已绑定队长档案" }, { status: 400 });
    }

    if (pendingRequest) {
      return NextResponse.json({ message: "已有待审核绑定申请" }, { status: 400 });
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        { message: "未找到匹配的队长档案，请联系队长主管核实手机号。" },
        { status: 404 },
      );
    }

    if (candidates.length > 1) {
      return NextResponse.json(
        { message: "存在多个匹配档案，请联系队长主管处理。" },
        { status: 409 },
      );
    }

    const leader = candidates[0];
    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.leaderBindRequest.create({
        data: {
          userId: user.id,
          leaderId: leader.id,
          userPhone: user.phone,
          leaderPhone: leader.phone,
          realNameInput: user.name,
          status: LeaderBindRequestStatus.PENDING,
          matchScore: 100,
          matchReason: "手机号一致",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "LEADER_BIND_REQUESTED",
          targetType: "LeaderBindRequest",
          targetId: created.id,
          afterJson: JSON.stringify(created),
        },
      });

      return created;
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
