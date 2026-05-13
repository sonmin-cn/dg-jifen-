import { NextRequest, NextResponse } from "next/server";
import type { TripStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { tripListSelect } from "@/lib/services/trip-select";
import { TRIP_STATUS_OPTIONS } from "@/lib/constants/trips";

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/:id/status",
      { mode: "throw" },
    );
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      status?: string;
    } | null;
    const status = body?.status;

    if (!status || !TRIP_STATUS_OPTIONS.includes(status as TripStatus)) {
      return NextResponse.json(
        { message: "请选择有效团期状态", errors: { status: "请选择有效团期状态" } },
        { status: 400 },
      );
    }

    const before = await prisma.trip.findUnique({
      where: { id },
      select: tripListSelect,
    });

    if (!before) {
      return NextResponse.json({ message: "团期不存在" }, { status: 404 });
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: { status: status as TripStatus },
      select: tripListSelect,
    });

    await writeAuditLog({
      userId: user.id,
      action: "TRIP_STATUS_UPDATED",
      targetType: "Trip",
      targetId: id,
      before,
      after: trip,
    });

    return NextResponse.json({ trip });
  } catch (error) {
    return errorResponse(error);
  }
}
