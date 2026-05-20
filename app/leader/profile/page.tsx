import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_STATUS_LABELS, formatLeaderDisplayLevel } from "@/lib/constants/leaders";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/back-button";

export default async function LeaderProfilePage() {
  const user = await requireRole(["LEADER"], "/leader/profile");
  const leader = await prisma.leader.findUnique({
    where: { userId: user.id },
    select: leaderDetailSelect,
  });

  if (!leader) {
    redirect("/leader/bind");
  }

  return (
    <div className="mt-6 md:mt-8">
      <BackButton fallbackHref="/leader/dashboard" />
      <section className="rounded-lg border bg-card p-4 shadow-sm md:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">我的档案</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            以下信息由管理后台维护。
          </p>
        </div>
        <Badge variant="secondary">{LEADER_STATUS_LABELS[leader.status]}</Badge>
      </div>
      <div className="grid gap-4">
        <InfoGroup title="基础信息">
          <Info label="姓名" value={leader.realName} />
          <Info label="昵称" value={leader.nickname} />
          <Info label="手机号" value={leader.phone} />
          <Info label="区域" value={leader.region} />
          <Info label="常驻地" value={leader.residentLocation} />
        </InfoGroup>
        <InfoGroup title="队长身份">
          <Info label="状态" value={LEADER_STATUS_LABELS[leader.status]} />
          <Info label="等级" value={formatLeaderDisplayLevel(leader.status, leader.level)} />
          <Info label="队长身份" value={leader.rawLeaderIdentity} />
          <Info label="原始等级" value={leader.rawLeaderLevel} />
          <Info label="岗位状态" value={leader.rawJobStatus} />
        </InfoGroup>
        <InfoGroup title="带队数据">
          <Info label="带队次数" value={leader.leadCount?.toString()} />
          <Info label="带队天数" value={leader.leadDays?.toString()} />
          <Info label="入职日期" value={formatDate(leader.joinDate)} />
          <Info label="推荐人" value={leader.recommenderLeader?.realName} />
        </InfoGroup>
        <InfoGroup title="账号绑定状态">
          <Info label="绑定账号" value={leader.user?.username} />
          <Info label="标签" value={leader.tags} />
          <Info label="备注" value={leader.remark} />
        </InfoGroup>
      </div>
      </section>
    </div>
  );
}

function InfoGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border bg-muted/20 p-4">
      <h3 className="font-medium">{title}</h3>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">{children}</div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value || "-"}</p>
    </div>
  );
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return value.toISOString().slice(0, 10);
}
