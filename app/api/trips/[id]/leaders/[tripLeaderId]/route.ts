import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { validateTripLeaderInput } from "@/lib/validations/trip";

type RouteContext = {
  params: Promise<{ id: string; tripLeaderId: string }>;
};

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

const tripLeaderInclude = {
  leader: {
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
      status: true,
    },
  },
} as const;

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/:id/leaders/:tripLeaderId",
      { mode: "throw" },
    );
    const { id, tripLeaderId } = await context.params;
    const before = await prisma.tripLeader.findFirst({
      where: { id: tripLeaderId, tripId: id },
      include: tripLeaderInclude,
    });

    if (!before) {
      return NextResponse.json({ message: "带队记录不存在" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const result = await validateTripLeaderInput(id, body || {}, {
      currentTripLeaderId: tripLeaderId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { message: "表单校验失败", errors: result.errors },
        { status: 400 },
      );
    }

    const tripLeader = await prisma.tripLeader.update({
      where: { id: tripLeaderId },
      data: result.data,
      include: tripLeaderInclude,
    });

    await writeAuditLog({
      userId: user.id,
      action: "TRIP_LEADER_UPDATED",
      targetType: "TripLeader",
      targetId: tripLeaderId,
      before,
      after: tripLeader,
    });

    return NextResponse.json({ tripLeader });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/:id/leaders/:tripLeaderId",
      { mode: "throw" },
    );
    const { id, tripLeaderId } = await context.params;
    const before = await prisma.tripLeader.findFirst({
      where: { id: tripLeaderId, tripId: id },
      include: tripLeaderInclude,
    });

    if (!before) {
      return NextResponse.json({ message: "带队记录不存在" }, { status: 404 });
    }

    await prisma.tripLeader.delete({
      where: { id: tripLeaderId },
    });

    await writeAuditLog({
      userId: user.id,
      action: "TRIP_LEADER_REMOVED",
      targetType: "TripLeader",
      targetId: tripLeaderId,
      before,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
