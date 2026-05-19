import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { LEADER_STATUS_LABELS } from "@/lib/constants/leaders";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import { LeaderEditForm } from "@/app/admin/leaders/[id]/LeaderEditForm";
import { DeleteLeaderButton } from "@/app/admin/leaders/[id]/DeleteLeaderButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLeaderDetailPage({ params }: PageProps) {
  const user = await requireRole(LEADER_MANAGEMENT_ROLES, "/admin/leaders/:id");
  const { id } = await params;
  const [leader, recommenderOptions] = await Promise.all([
    prisma.leader.findUnique({
      where: { id },
      select: leaderDetailSelect,
    }),
    prisma.leader.findMany({
      where: {
        id: { not: id },
      },
      select: {
        id: true,
        realName: true,
        nickname: true,
      },
      orderBy: { realName: "asc" },
    }),
  ]);

  if (!leader) {
    notFound();
  }

  const canDelete = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const deleteBlockReason = canDelete
    ? await getLeaderDeleteBlockReason(id, Boolean(leader.user))
    : "当前角色不能删除队长档案。";

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button className="mb-4" size="sm" variant="outline" asChild>
            <Link href="/admin/leaders">返回列表</Link>
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{leader.realName}</h2>
            <Badge variant="secondary">{LEADER_STATUS_LABELS[leader.status]}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {leader.nickname || "无昵称"} · {leader.phone}
          </p>
        </div>
      </div>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-3">
        <Info label="区域" value={leader.region} />
        <Info label="等级" value={leader.level} />
        <Info label="推荐人" value={leader.recommenderLeader?.realName} />
        <Info label="入职日期" value={formatDate(leader.joinDate)} />
        <Info label="绑定账号" value={leader.user?.username} />
        <Info label="外部队长 ID" value={leader.externalLeaderId} />
        <Info label="常驻地" value={leader.residentLocation} />
        <Info label="岗位状态" value={leader.jobStatus} />
        <Info label="导入来源" value={leader.sourceSystem} />
        <Info label="最近导入时间" value={formatDateTime(leader.lastImportedAt)} />
        <Info label="标签" value={leader.tags} />
        <Info label="备注" value={leader.remark} wide />
      </section>

      <LeaderEditForm
        leader={leader}
        recommenderOptions={recommenderOptions}
      />
      {canDelete ? (
        <DeleteLeaderButton
          leaderId={leader.id}
          disabledReason={deleteBlockReason}
        />
      ) : null}
    </div>
  );
}

async function getLeaderDeleteBlockReason(id: string, hasBoundUser: boolean) {
  if (hasBoundUser) {
    return "该队长已绑定账号，不能删除，请设为离职。";
  }

  const [
    tripLeaders,
    scoreRecords,
    scoreApplications,
    violationEvents,
    bonusSettlementItems,
    bindRequests,
    socialPosts,
    repurchaseClaims,
    holidayAttendances,
    bonusSettlements,
  ] = await Promise.all([
    prisma.tripLeader.count({ where: { leaderId: id } }),
    prisma.scoreRecord.count({ where: { leaderId: id } }),
    prisma.scoreApplication.count({ where: { leaderId: id } }),
    prisma.violationEvent.count({ where: { leaderId: id } }),
    prisma.bonusSettlementItem.count({ where: { leaderId: id } }),
    prisma.leaderBindRequest.count({ where: { leaderId: id } }),
    prisma.socialPost.count({ where: { leaderId: id } }),
    prisma.repurchaseClaim.count({ where: { leaderId: id } }),
    prisma.holidayAttendance.count({ where: { leaderId: id } }),
    prisma.bonusSettlement.count({ where: { leaderId: id } }),
  ]);
  const total =
    tripLeaders +
    scoreRecords +
    scoreApplications +
    violationEvents +
    bonusSettlementItems +
    bindRequests +
    socialPosts +
    repurchaseClaims +
    holidayAttendances +
    bonusSettlements;

  return total > 0 ? "该队长已有业务记录，不能删除，请设为离职。" : "";
}

function Info({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return value.toISOString().slice(0, 10);
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "-";
  }

  return value.toISOString().slice(0, 19).replace("T", " ");
}
