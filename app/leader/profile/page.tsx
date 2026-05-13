import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_STATUS_LABELS } from "@/lib/constants/leaders";
import { leaderDetailSelect } from "@/lib/services/leader-select";

export default async function LeaderProfilePage() {
  const user = await requireRole(["LEADER"], "/leader/profile");
  const leader = await prisma.leader.findUnique({
    where: { userId: user.id },
    select: leaderDetailSelect,
  });

  if (!leader) {
    return (
      <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">我的档案</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          当前账号尚未绑定队长档案，请联系管理员。
        </p>
      </section>
    );
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
        <Info label="等级" value={leader.level} />
        <Info label="推荐人" value={leader.recommenderLeader?.realName} />
        <Info label="入职日期" value={formatDate(leader.joinDate)} />
        <Info label="转正日期" value={formatDate(leader.regularDate)} />
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
