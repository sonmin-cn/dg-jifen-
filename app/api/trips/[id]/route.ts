import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES, TRIP_READ_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { tripListSelect } from "@/lib/services/trip-select";
import { validateTripInput } from "@/lib/validations/trip";

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

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireRole(TRIP_READ_ROLES, "/api/trips/:id", { mode: "throw" });
    const { id } = await context.params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: tripListSelect,
    });

    if (!trip) {
      return NextResponse.json({ message: "团期不存在" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(TRIP_MANAGEMENT_ROLES, "/api/trips/:id", {
      mode: "throw",
    });
    const { id } = await context.params;
    const before = await prisma.trip.findUnique({
      where: { id },
      select: tripListSelect,
    });

    if (!before) {
      return NextResponse.json({ message: "团期不存在" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const result = validateTripInput(body || {});

    if (!result.ok) {
      return NextResponse.json(
        { message: "表单校验失败", errors: result.errors },
        { status: 400 },
      );
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: result.data,
      select: tripListSelect,
    });

    await writeAuditLog({
      userId: user.id,
      action: "TRIP_UPDATED",
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
