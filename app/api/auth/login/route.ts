import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createLoginSession, getHomePathForRole } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    identifier?: string;
    username?: string;
    password?: string;
  } | null;
  const identifier = body?.identifier?.trim() || body?.username?.trim();
  const password = body?.password;
  const isPhoneLogin = Boolean(identifier && /^1\d{10}$/.test(identifier));

  if (!identifier || !password) {
    await writeAuditLog({
      action: "LOGIN_FAILED",
      targetType: "USER",
      targetId: identifier || "unknown",
      after: { reason: "missing_credentials" },
    });

    return NextResponse.json(
      { message: "请输入手机号或用户名和密码" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: isPhoneLogin ? { phone: identifier } : { username: identifier },
    select: {
      id: true,
      username: true,
      name: true,
      passwordHash: true,
      role: true,
      status: true,
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await writeAuditLog({
      userId: user?.id,
      action: "LOGIN_FAILED",
      targetType: "USER",
      targetId: identifier,
      after: {
        reason: "invalid_credentials",
        loginMethod: isPhoneLogin ? "phone" : "username",
      },
    });

    return NextResponse.json(
      { message: "账号或密码错误" },
      { status: 401 },
    );
  }

  if (user.status !== "ACTIVE") {
    await writeAuditLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      targetType: "USER",
      targetId: user.id,
      after: {
        reason: "user_disabled",
        username: user.username,
        loginMethod: isPhoneLogin ? "phone" : "username",
      },
    });

    return NextResponse.json(
      { message: "账号已停用，请联系管理员" },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    redirectTo: getHomePathForRole(user.role),
  });

  createLoginSession(response, {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  await writeAuditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    targetType: "USER",
    targetId: user.id,
    after: {
      username: user.username,
      role: user.role,
      loginMethod: isPhoneLogin ? "phone" : "username",
    },
  });

  return response;
}
