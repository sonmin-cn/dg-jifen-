import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/services/audit";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import {
  LEADER_LEVEL_OPTIONS,
  LEADER_STATUS_OPTIONS,
} from "@/lib/constants/leaders";
import {
  validateLeaderInput,
} from "@/lib/validations/leader";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(LEADER_MANAGEMENT_ROLES, "/api/leaders", {
      mode: "throw",
    });

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "10"), 1),
      50,
    );
    const keyword = searchParams.get("keyword")?.trim();
    const region = searchParams.get("region")?.trim();
    const status = searchParams.get("status")?.trim();
    const level = searchParams.get("level")?.trim();
    const where: Prisma.LeaderWhereInput = {};

    if (keyword) {
      where.OR = [
        { realName: { contains: keyword } },
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    if (region) {
      where.region = { contains: region };
    }

    if (status && LEADER_STATUS_OPTIONS.includes(status as never)) {
      where.status = status as never;
    }

    if (level && LEADER_LEVEL_OPTIONS.includes(level)) {
      where.level = level;
    }

    const [leaders, total] = await Promise.all([
      prisma.leader.findMany({
        where,
        select: leaderDetailSelect,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leader.count({ where }),
    ]);

    return NextResponse.json({
      leaders,
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
    const user = await requireRole(LEADER_MANAGEMENT_ROLES, "/api/leaders", {
      mode: "throw",
    });
    const body = await request.json().catch(() => null);
    const result = await validateLeaderInput(body || {});

    if (!result.ok) {
      return NextResponse.json(
        { message: "表单校验失败", errors: result.errors },
        { status: 400 },
      );
    }

    const leader = await prisma.leader.create({
      data: result.data,
      select: leaderDetailSelect,
    });

    await writeAuditLog({
      userId: user.id,
      action: "LEADER_CREATED",
      targetType: "Leader",
      targetId: leader.id,
      after: leader,
    });

    return NextResponse.json({ leader }, { status: 201 });
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
