import { LeaderBindRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function getLeaderBindingState(userId: string) {
  const [leader, latestRequest] = await Promise.all([
    prisma.leader.findUnique({
      where: { userId },
      select: { id: true, realName: true },
    }),
    prisma.leaderBindRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        rejectReason: true,
        createdAt: true,
        leader: {
          select: {
            realName: true,
            nickname: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  return {
    leader,
    latestRequest,
    isBound: Boolean(leader),
    isPending: latestRequest?.status === LeaderBindRequestStatus.PENDING,
    latestRejectReason:
      latestRequest?.status === LeaderBindRequestStatus.REJECTED
        ? latestRequest.rejectReason
        : null,
  };
}

export function maskPhone(phone: string) {
  if (phone.length < 4) {
    return "****";
  }

  return `*******${phone.slice(-4)}`;
}
