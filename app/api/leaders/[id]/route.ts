import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import { validateLeaderInput } from "@/lib/validations/leader";

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

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireRole(LEADER_MANAGEMENT_ROLES, "/api/leaders/:id", {
      mode: "throw",
    });
    const { id } = await context.params;
    const leader = await prisma.leader.findUnique({
      where: { id },
      select: leaderDetailSelect,
    });

    if (!leader) {
      return NextResponse.json({ message: "队长不存在" }, { status: 404 });
    }

    return NextResponse.json({ leader });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(LEADER_MANAGEMENT_ROLES, "/api/leaders/:id", {
      mode: "throw",
    });
    const { id } = await context.params;
    const before = await prisma.leader.findUnique({
      where: { id },
      select: leaderDetailSelect,
    });

    if (!before) {
      return NextResponse.json({ message: "队长不存在" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const result = await validateLeaderInput(body || {}, {
      currentLeaderId: id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { message: "表单校验失败", errors: result.errors },
        { status: 400 },
      );
    }

    const leader = await prisma.leader.update({
      where: { id },
      data: result.data,
      select: leaderDetailSelect,
    });

    await writeAuditLog({
      userId: user.id,
      action: "LEADER_UPDATED",
      targetType: "Leader",
      targetId: id,
      before,
      after: leader,
    });

    return NextResponse.json({ leader });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "手机号已存在", errors: { phone: "手机号已存在" } },
        { status: 400 },
      );
    }

    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(["SUPER_ADMIN", "ADMIN"], "/api/leaders/:id", {
      mode: "throw",
    });
    const { id } = await context.params;
    const leader = await prisma.leader.findUnique({
      where: { id },
      select: leaderDetailSelect,
    });

    if (!leader) {
      return NextResponse.json({ message: "队长不存在" }, { status: 404 });
    }

    const blockReason = await getLeaderDeleteBlockReason(id, Boolean(leader.user));
    if (blockReason) {
      return NextResponse.json({ message: blockReason }, { status: 400 });
    }

    await prisma.leader.delete({ where: { id } });

    await writeAuditLog({
      userId: user.id,
      action: "LEADER_DELETED",
      targetType: "Leader",
      targetId: id,
      before: leader,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

async function getLeaderDeleteBlockReason(id: string, hasBoundUser: boolean) {
  if (hasBoundUser) {
    return "该队长已有业务记录，不能删除，请设为离职。";
  }

  const [
    tripLeaders,
    scoreRecords,
    scoreApplications,
    violationEvents,
    bonusSettlementItems,
    bindRequests,
    socialPosts,
    repurchaseClaims,
    holidayAttendances,
    bonusSettlements,
  ] = await Promise.all([
    prisma.tripLeader.count({ where: { leaderId: id } }),
    prisma.scoreRecord.count({ where: { leaderId: id } }),
    prisma.scoreApplication.count({ where: { leaderId: id } }),
    prisma.violationEvent.count({ where: { leaderId: id } }),
    prisma.bonusSettlementItem.count({ where: { leaderId: id } }),
    prisma.leaderBindRequest.count({ where: { leaderId: id } }),
    prisma.socialPost.count({ where: { leaderId: id } }),
    prisma.repurchaseClaim.count({ where: { leaderId: id } }),
    prisma.holidayAttendance.count({ where: { leaderId: id } }),
    prisma.bonusSettlement.count({ where: { leaderId: id } }),
  ]);
  const total =
    tripLeaders +
    scoreRecords +
    scoreApplications +
    violationEvents +
    bonusSettlementItems +
    bindRequests +
    socialPosts +
    repurchaseClaims +
    holidayAttendances +
    bonusSettlements;

  return total > 0 ? "该队长已有业务记录，不能删除，请设为离职。" : "";
}
