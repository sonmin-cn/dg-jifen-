import { NextRequest, NextResponse } from "next/server";
import type { Prisma, TripStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES, TRIP_READ_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { tripListSelect } from "@/lib/services/trip-select";
import { TRIP_STATUS_OPTIONS } from "@/lib/constants/trips";
import { validateTripInput } from "@/lib/validations/trip";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(TRIP_READ_ROLES, "/api/trips", { mode: "throw" });

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "10"), 1),
      50,
    );
    const keyword = searchParams.get("keyword")?.trim();
    const region = searchParams.get("region")?.trim();
    const status = searchParams.get("status")?.trim();
    const dateFrom = parseDateParam(searchParams.get("dateFrom"));
    const dateTo = parseDateParam(searchParams.get("dateTo"), true);
    const where: Prisma.TripWhereInput = {};

    if (keyword) {
      where.routeName = { contains: keyword };
    }

    if (region) {
      where.region = { contains: region };
    }

    if (status && TRIP_STATUS_OPTIONS.includes(status as TripStatus)) {
      where.status = status as TripStatus;
    }

    if (dateFrom || dateTo) {
      where.startDate = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      };
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        select: tripListSelect,
        orderBy: [
          { updatedAt: "desc" },
          { createdAt: "desc" },
          { startDate: "desc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trip.count({ where }),
    ]);

    return NextResponse.json({
      trips,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(TRIP_MANAGEMENT_ROLES, "/api/trips", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = validateTripInput(body || {});

    if (!result.ok) {
      return NextResponse.json(
        { message: "表单校验失败", errors: result.errors },
        { status: 400 },
      );
    }

    const trip = await prisma.trip.create({
      data: result.data,
      select: tripListSelect,
    });

    await writeAuditLog({
      userId: user.id,
      action: "TRIP_CREATED",
      targetType: "Trip",
      targetId: trip.id,
      after: trip,
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
