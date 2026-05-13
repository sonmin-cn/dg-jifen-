import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { leaderDetailSelect } from "@/lib/services/leader-select";

export async function GET() {
  try {
    const user = await requireRole(["LEADER"], "/api/leader/profile", {
      mode: "throw",
    });

    const leader = await prisma.leader.findUnique({
      where: { userId: user.id },
      select: leaderDetailSelect,
    });

    if (!leader) {
      return NextResponse.json(
        { message: "当前账号尚未绑定队长档案，请联系管理员" },
        { status: 404 },
      );
    }

    return NextResponse.json({ leader });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
