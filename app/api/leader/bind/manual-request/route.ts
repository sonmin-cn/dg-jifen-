import { NextRequest, NextResponse } from "next/server";
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

const NOT_FOUND_MESSAGE =
  "未找到匹配的队长档案，请核对姓名和手机号后重试，或联系队长主管。";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["LEADER"], "/api/leader/bind/manual-request", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const realName = typeof body?.realName === "string" ? body.realName.trim() : "";
    const leaderPhone =
      typeof body?.leaderPhone === "string" ? body.leaderPhone.replace(/\s+/g, "") : "";

    if (!realName || !leaderPhone) {
      return NextResponse.json(
        { message: "请填写档案登记的真实姓名和手机号" },
        { status: 400 },
      );
    }

    const [existingBoundLeader, pendingRequest, leader] = await Promise.all([
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
      prisma.leader.findFirst({
        where: { phone: leaderPhone, userId: null },
        select: { id: true, realName: true, phone: true },
      }),
    ]);

    if (existingBoundLeader) {
      return NextResponse.json({ message: "当前账号已绑定队长档案" }, { status: 400 });
    }

    if (pendingRequest) {
      return NextResponse.json({ message: "已有待审核绑定申请" }, { status: 400 });
    }

    // 姓名与手机号必须同时匹配，避免通过接口枚举档案手机号；错误信息保持一致不泄露差异
    if (!leader || leader.realName.trim() !== realName) {
      return NextResponse.json({ message: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const bindRequest = await tx.leaderBindRequest.create({
        data: {
          userId: user.id,
          leaderId: leader.id,
          userPhone: user.phone,
          leaderPhone: leader.phone,
          realNameInput: realName,
          status: LeaderBindRequestStatus.PENDING,
          matchScore: 60,
          matchReason:
            user.phone === leader.phone
              ? "人工申请：姓名+手机号一致"
              : "人工申请：姓名+档案手机号一致，注册手机号与档案不一致，请重点核实",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "LEADER_BIND_MANUAL_REQUESTED",
          targetType: "LeaderBindRequest",
          targetId: bindRequest.id,
          afterJson: JSON.stringify(bindRequest),
        },
      });

      return bindRequest;
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
