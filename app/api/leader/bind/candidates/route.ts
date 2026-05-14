import { NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { getLeaderBindingState, maskPhone } from "@/lib/services/leader-binding";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "查询绑定候选档案失败" }, { status: 500 });
}

export async function GET() {
  try {
    const user = await requireRole(["LEADER"], "/api/leader/bind/candidates", {
      mode: "throw",
    });
    const state = await getLeaderBindingState(user.id);

    if (state.isBound) {
      return NextResponse.json({ status: "BOUND", candidates: [] });
    }

    const candidates = await prisma.leader.findMany({
      where: {
        phone: user.phone,
        userId: null,
      },
      select: {
        id: true,
        realName: true,
        nickname: true,
        phone: true,
        residentLocation: true,
        region: true,
        rawLeaderIdentity: true,
        rawLeaderLevel: true,
        status: true,
        level: true,
      },
    });

    if (state.isPending) {
      return NextResponse.json({
        status: "PENDING",
        latestRequest: state.latestRequest,
        candidates: [],
      });
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        status: "NO_MATCH",
        latestRequest: state.latestRequest,
        candidates: [],
      });
    }

    if (candidates.length > 1) {
      return NextResponse.json({
        status: "MULTIPLE_MATCHES",
        latestRequest: state.latestRequest,
        candidates: [],
      });
    }

    return NextResponse.json({
      status: "READY",
      latestRequest: state.latestRequest,
      candidates: candidates.map((candidate) => ({
        ...candidate,
        maskedPhone: maskPhone(candidate.phone),
        phone: undefined,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
