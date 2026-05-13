import { prisma } from "@/lib/db/prisma";

type AuditInput = {
  userId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
};

function stringifyAuditValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.stringify(value);
}

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        beforeJson: stringifyAuditValue(input.before),
        afterJson: stringifyAuditValue(input.after),
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
