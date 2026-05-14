import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/services/audit";

export async function miniappPlaceholder(targetId: string) {
  const session = await getSession();

  await writeAuditLog({
    userId: session?.userId || null,
    action: "MINIAPP_INTEGRATION_PLACEHOLDER_CALLED",
    targetType: "MiniappIntegration",
    targetId,
    after: { status: 501, message: "Not Implemented" },
  });

  return NextResponse.json(
    { message: "Not Implemented" },
    { status: 501 },
  );
}
