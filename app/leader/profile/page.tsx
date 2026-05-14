import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_STATUS_LABELS } from "@/lib/constants/leaders";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import { redirect } from "next/navigation";

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
    <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">我的档案</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            以下信息由管理后台维护。
          </p>
        </div>
        <Badge variant="secondary">{LEADER_STATUS_LABELS[leader.status]}</Badge>
      </div>
      <div className="grid gap-4 text-sm md:grid-cols-3">
        <Info label="姓名" value={leader.realName} />
        <Info label="昵称" value={leader.nickname} />
        <Info label="手机号" value={leader.phone} />
        <Info label="区域" value={leader.region} />
        <Info label="常驻地" value={leader.residentLocation} />
        <Info label="等级" value={leader.level} />
        <Info label="推荐人" value={leader.recommenderLeader?.realName} />
        <Info label="入职日期" value={formatDate(leader.joinDate)} />
        <Info label="队长身份" value={leader.rawLeaderIdentity} />
        <Info label="原始等级" value={leader.rawLeaderLevel} />
        <Info label="岗位状态" value={leader.rawJobStatus} />
        <Info label="标签" value={leader.tags} />
        <Info label="备注" value={leader.remark} wide />
      </div>
    </section>
  );
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
    <div className={wide ? "md:col-span-3" : undefined}>
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
