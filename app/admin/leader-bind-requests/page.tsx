import Link from "next/link";
import { LeaderBindRequestStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { LeaderBindRequestActions } from "@/app/admin/leader-bind-requests/LeaderBindRequestActions";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusLabels: Record<LeaderBindRequestStatus, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
  CANCELLED: "已取消",
};

export default async function AdminLeaderBindRequestsPage({
  searchParams,
}: PageProps) {
  await requireRole(LEADER_MANAGEMENT_ROLES, "/admin/leader-bind-requests");
  const params = await searchParams;
  const status = getParam(params.status);
  const where =
    status &&
    Object.values(LeaderBindRequestStatus).includes(
      status as LeaderBindRequestStatus,
    )
      ? { status: status as LeaderBindRequestStatus }
      : {};
  const requests = await prisma.leaderBindRequest.findMany({
    where,
    include: {
      user: {
        select: { username: true, name: true, phone: true },
      },
      leader: {
        select: { realName: true, nickname: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">队长绑定审核</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            审核队长自助注册账号与队长业务档案的绑定申请。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/leaders">返回队长档案</Link>
        </Button>
      </div>

      <form className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          defaultValue={status}
          name="status"
        >
          <option value="">全部状态</option>
          {Object.values(LeaderBindRequestStatus).map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </select>
        <Button type="submit">筛选</Button>
      </form>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1100px] border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>状态</Th>
              <Th>申请账号</Th>
              <Th>用户手机号</Th>
              <Th>队长档案</Th>
              <Th>档案手机号</Th>
              <Th>匹配说明</Th>
              <Th>申请时间</Th>
              <Th>审核信息</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <tr className="border-t" key={request.id}>
                  <Td>
                    <Badge variant={request.status === "PENDING" ? "secondary" : "outline"}>
                      {statusLabels[request.status]}
                    </Badge>
                  </Td>
                  <Td>
                    {request.user.name}
                    <span className="block text-muted-foreground">
                      {request.user.username}
                    </span>
                  </Td>
                  <Td>{request.userPhone}</Td>
                  <Td>
                    {request.leader.realName}
                    <span className="block text-muted-foreground">
                      {request.leader.nickname || "-"}
                    </span>
                  </Td>
                  <Td>{request.leaderPhone}</Td>
                  <Td>
                    {request.matchReason || "-"}
                    <span className="block text-muted-foreground">
                      匹配分：{request.matchScore ?? "-"}
                    </span>
                  </Td>
                  <Td>{formatDateTime(request.createdAt)}</Td>
                  <Td>
                    {request.rejectReason || "-"}
                    {request.reviewedAt ? (
                      <span className="block text-muted-foreground">
                        {formatDateTime(request.reviewedAt)}
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    {request.status === "PENDING" ? (
                      <LeaderBindRequestActions requestId={request.id} />
                    ) : (
                      "-"
                    )}
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={9}>
                  暂无绑定申请。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "-";
  }

  return value.toISOString().slice(0, 19).replace("T", " ");
}
