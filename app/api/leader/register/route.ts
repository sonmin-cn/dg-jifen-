import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { createLoginSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return normalizeRequiredString(value).replace(/[^\d]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = normalizeRequiredString(body?.username);
    const phone = normalizePhone(body?.phone);
    const realName = normalizeRequiredString(body?.realName);
    const password = normalizeRequiredString(body?.password);
    const confirmPassword = normalizeRequiredString(body?.confirmPassword);
    const errors: Record<string, string> = {};

    if (!username) {
      errors.username = "用户名必填";
    }
    if (!phone) {
      errors.phone = "手机号必填";
    } else if (!/^1\d{10}$/.test(phone)) {
      errors.phone = "手机号格式异常";
    }
    if (!realName) {
      errors.realName = "姓名必填";
    }
    if (!password) {
      errors.password = "密码必填";
    }
    if (password && password !== confirmPassword) {
      errors.confirmPassword = "两次输入的密码不一致";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: Object.values(errors)[0] || "表单校验失败",
          errors,
        },
        { status: 400 },
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          name: realName,
          phone,
          passwordHash: hashPassword(password),
          role: UserRole.LEADER,
          status: UserStatus.ACTIVE,
          authProvider: "PASSWORD",
        },
        select: {
          id: true,
          username: true,
          name: true,
          phone: true,
          role: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: created.id,
          action: "LEADER_REGISTERED",
          targetType: "User",
          targetId: created.id,
          afterJson: JSON.stringify(created),
        },
      });

      return created;
    });

    const response = NextResponse.json(
      { success: true, userId: user.id, message: "注册成功" },
      { status: 201 },
    );

    createLoginSession(response, {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target || "");
      const field = target.includes("username") ? "username" : "phone";

      return NextResponse.json(
        {
          success: false,
          error: field === "username" ? "用户名已存在" : "手机号已存在",
          errors: {
            [field]: field === "username" ? "用户名已存在" : "手机号已存在",
          },
        },
        { status: 400 },
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, error: "注册失败" },
      { status: 500 },
    );
  }
}
