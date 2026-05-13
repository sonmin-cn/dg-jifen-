import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/services/audit";

const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "PRODUCT_MANAGER",
  "FINANCE",
  "ADMIN",
  "EXECUTIVE_VIEWER",
];

export function isAdminRole(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export function isLeaderRole(role: UserRole) {
  return role === "LEADER";
}

type RequireMode = "redirect" | "throw";

export class AuthError extends Error {
  status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireAuth(options?: {
  mode?: RequireMode;
  targetPath?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    await writeAuditLog({
      action: "AUTH_REQUIRED",
      targetType: options?.mode === "throw" ? "API" : "ROUTE",
      targetId: options?.targetPath || "protected",
      after: { reason: "not_authenticated" },
    });

    if (options?.mode === "throw") {
      throw new AuthError("请先登录", 401);
    }

    redirect("/login");
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRole[],
  targetPath: string,
  options?: { mode?: RequireMode },
) {
  const user = await requireAuth({
    mode: options?.mode,
    targetPath,
  });

  if (!allowedRoles.includes(user.role)) {
    await writeAuditLog({
      userId: user.id,
      action: "PERMISSION_DENIED",
      targetType: options?.mode === "throw" ? "API" : "ROUTE",
      targetId: targetPath,
      after: {
        role: user.role,
        allowedRoles,
      },
    });

    if (options?.mode === "throw") {
      throw new AuthError("无权访问", 403);
    }

    redirect(user.role === "LEADER" ? "/leader/dashboard" : "/admin/dashboard");
  }

  return user;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export { ADMIN_ROLES };
