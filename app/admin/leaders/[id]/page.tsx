import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { LEADER_STATUS_LABELS } from "@/lib/constants/leaders";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import { LeaderEditForm } from "@/app/admin/leaders/[id]/LeaderEditForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLeaderDetailPage({ params }: PageProps) {
  await requireRole(LEADER_MANAGEMENT_ROLES, "/admin/leaders/:id");
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

  return (
    <div className="py-8">
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
        <Info label="转正日期" value={formatDate(leader.regularDate)} />
        <Info label="绑定账号" value={leader.user?.username} />
        <Info label="标签" value={leader.tags} />
        <Info label="备注" value={leader.remark} wide />
      </section>

      <LeaderEditForm
        leader={leader}
        recommenderOptions={recommenderOptions}
      />
    </div>
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
