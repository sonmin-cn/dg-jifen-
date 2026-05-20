import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Award, Trophy, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export default async function LeaderBonusPage() {
  const user = await requireRole(["LEADER"], "/leader/bonus");
  const [leader, scoreYear] = await Promise.all([
    prisma.leader.findUnique({
      where: { userId: user.id },
      select: { id: true, realName: true, nickname: true, status: true },
    }),
    prisma.scoreYear.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
    }),
  ]);

  if (!leader) {
    redirect("/leader/bind");
  }

  if (!scoreYear) {
    return (
      <div className="mt-6 space-y-4">
        <BackButton fallbackHref="/leader/dashboard" />
        <h2 className="text-2xl font-semibold">我的奖金测算</h2>
        <p className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
          暂无当前积分年度，请联系管理员配置后查看。
        </p>
      </div>
    );
  }

  const [pool, myRecords, allLeaderPoints, tripLeaders, latestSettlementItem] =
    await Promise.all([
      prisma.bonusPool.aggregate({
        where: { scoreYearId: scoreYear.id },
        _sum: { amount: true },
      }),
      prisma.scoreRecord.findMany({
        where: {
          scoreYearId: scoreYear.id,
          leaderId: leader.id,
          status: "EFFECTIVE",
        },
        select: { effectivePoints: true },
      }),
      prisma.scoreRecord.groupBy({
        by: ["leaderId"],
        where: { scoreYearId: scoreYear.id, status: "EFFECTIVE" },
        _sum: { effectivePoints: true },
      }),
      prisma.tripLeader.findMany({
        where: {
          leaderId: leader.id,
          isCompleted: true,
          trip: {
            status: "COMPLETED",
            endDate: { gte: scoreYear.startDate, lte: scoreYear.endDate },
          },
        },
        select: { actualWorkDays: true },
      }),
      prisma.bonusSettlementItem.findFirst({
        where: { leaderId: leader.id, settlement: { scoreYearId: scoreYear.id } },
        include: {
          settlement: {
            select: { id: true, title: true, createdAt: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const totalPoints = round(
    myRecords.reduce((sum, record) => sum + record.effectivePoints, 0),
  );
  const tripCount = tripLeaders.length;
  const tripDays = round(
    tripLeaders.reduce((sum, record) => sum + record.actualWorkDays, 0),
  );
  const ranking = allLeaderPoints
    .map((entry) => ({
      leaderId: entry.leaderId,
      totalPoints: entry._sum.effectivePoints || 0,
    }))
    .filter((entry) => entry.totalPoints !== 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);
  const rankIndex = ranking.findIndex((entry) => entry.leaderId === leader.id);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;
  const bonusEligible =
    tripCount >= 8 &&
    totalPoints > 0 &&
    leader.status !== "LEFT" &&
    leader.status !== "SUSPENDED";

  return (
    <div className="mt-6 space-y-5 md:mt-8">
      <BackButton fallbackHref="/leader/dashboard" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">我的奖金测算</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            奖金测算仅供试运营参考，最终发放以公司确认的年度结算为准。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/leader/dashboard">返回首页</Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          icon={<WalletCards className="h-5 w-5 text-primary" />}
          label="当前奖金池总额"
          value={formatCurrency(pool._sum.amount || 0)}
          description={scoreYear.name}
        />
        <Card
          icon={<Award className="h-5 w-5 text-primary" />}
          label="我的有效积分"
          value={formatPoints(totalPoints)}
          description={bonusEligible ? "已满足初步资格" : "暂未满足初步资格"}
        />
        <Card
          icon={<Trophy className="h-5 w-5 text-primary" />}
          label="我的当前排名"
          value={rank ? `第 ${rank} 名` : "暂无排名"}
          description="仅按当前有效积分估算"
        />
      </section>

      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">奖金资格</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Info label="年度已完成带队次数" value={`${tripCount} / 8 次`} />
          <Info label="年度已完成带队天数" value={`${formatPoints(tripDays)} 天`} />
          <Info label="队长状态" value={leader.status} />
          <div>
            <p className="text-muted-foreground">初步资格</p>
            <Badge className="mt-1" variant={bonusEligible ? "secondary" : "outline"}>
              {bonusEligible ? "已满足" : "未满足"}
            </Badge>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">最近一次奖金测算</h3>
        {latestSettlementItem ? (
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Info label="测算标题" value={latestSettlementItem.settlement.title} />
            <Info label="测算时间" value={formatDateTime(latestSettlementItem.settlement.createdAt)} />
            <Info label="测算排名" value={`第 ${latestSettlementItem.rank} 名`} />
            <Info label="预计奖金" value={formatCurrency(latestSettlementItem.finalAmount)} />
          </div>
        ) : (
          <p className="mt-4 rounded-md border bg-muted/30 px-4 py-6 text-center text-muted-foreground">
            暂未生成奖金测算
          </p>
        )}
      </section>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

function formatDateTime(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}
