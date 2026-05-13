import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { validateTripLeaderInput } from "@/lib/validations/trip";

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
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/:id/leaders",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const result = await validateTripLeaderInput(id, body || {});

    if (!result.ok) {
      return NextResponse.json(
        { message: "表单校验失败", errors: result.errors },
        { status: 400 },
      );
    }

    const tripLeader = await prisma.tripLeader.create({
      data: {
        tripId: id,
        ...result.data,
      },
      include: {
        leader: {
          select: {
            id: true,
            realName: true,
            nickname: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "TRIP_LEADER_ADDED",
      targetType: "TripLeader",
      targetId: tripLeader.id,
      after: tripLeader,
    });

    return NextResponse.json({ tripLeader }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "同一个团期不能重复添加同一名队长" },
        { status: 400 },
      );
    }

    return errorResponse(error);
  }
}
