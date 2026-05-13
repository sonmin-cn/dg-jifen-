import { NextResponse } from "next/server";
import { clearLoginSession, getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/services/audit";

export async function POST() {
  const session = await getSession();
  const response = NextResponse.json({ ok: true });

  clearLoginSession(response);

  await writeAuditLog({
    userId: session?.userId,
    action: "LOGOUT",
    targetType: "USER",
    targetId: session?.userId || "anonymous",
    after: session
      ? { username: session.username, role: session.role }
      : { reason: "no_active_session" },
  });

  return response;
}
