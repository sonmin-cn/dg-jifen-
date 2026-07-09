import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { formatLeaderDisplayLevel } from "@/lib/constants/leaders";
import {
  formatRankingPoints,
  getAdminScoreRanking,
} from "@/lib/services/score-ranking";

export default async function LeaderRankingPage() {
  const user = await requireRole(["LEADER"], "/leader/ranking");
  const [leader, activeScoreYear] = await Promise.all([
    prisma.leader.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
    prisma.scoreYear.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!leader) {
    redirect("/leader/bind");
  }

  if (!activeScoreYear) {
    return (
      <div className="mt-6 space-y-4">
        <BackButton fallbackHref="/leader/dashboard" />
        <h2 className="text-2xl font-semibold">积分榜</h2>
        <p className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
          暂无当前积分年度，请联系管理员配置后查看。
        </p>
      </div>
    );
  }

  const ranking = await getAdminScoreRanking({
    scoreYearId: activeScoreYear.id,
    limit: "all",
  });
  const topRows = ranking.allRows.slice(0, 50);
  const myRow = ranking.allRows.find((row) => row.leader.id === leader.id);

  return (
    <div className="mt-6 space-y-5 md:mt-8">
      <BackButton fallbackHref="/leader/dashboard" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Trophy className="h-6 w-6 text-primary" />
            积分榜
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            仅展示当前积分年度前 50 名，不展示手机号、扣分原因或奖金金额。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/leader/dashboard">返回首页</Link>
        </Button>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="text-base font-semibold">我的排名</h3>
        {myRow ? (
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
            <Info label="当前年度" value={activeScoreYear.name} />
            <Info label="我的排名" value={`#${myRow.rank}`} />
            <Info label="年度有效积分" value={formatRankingPoints(myRow.totalPoints)} />
            <Info label="等级" value={formatLeaderDisplayLevel(myRow.leader.status, myRow.leader.level)} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            当前年度暂无有效积分或带队记录，暂未进入积分榜。
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        {topRows.length > 0 ? (
          <div className="divide-y">
            {topRows.map((row) => (
              <article className="flex items-center justify-between gap-3 p-4" key={row.leader.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={row.rank <= 3 ? "secondary" : "outline"}>#{row.rank}</Badge>
                    <p className="truncate font-medium">
                      {row.leader.nickname || maskRealName(row.leader.realName)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatLeaderDisplayLevel(row.leader.status, row.leader.level)}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold">
                  {formatRankingPoints(row.totalPoints)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            暂无积分榜数据。
          </p>
        )}
      </section>
    </div>
  );
}

// 榜单面向全体队长公开，无昵称时对真名脱敏，避免公开真实姓名
function maskRealName(name: string) {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
