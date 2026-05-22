import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Award, ClipboardCheck, Info, ListChecks } from "lucide-react";
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
        <h2 className="text-2xl font-semibold">奖金规则说明</h2>
        <p className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
          暂无当前积分年度，请联系管理员配置后查看。
        </p>
      </div>
    );
  }

  const [scoreRecords, tripLeaders] = await Promise.all([
    prisma.scoreRecord.findMany({
      where: {
        scoreYearId: scoreYear.id,
        leaderId: leader.id,
        status: "EFFECTIVE",
      },
      select: { effectivePoints: true },
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
  ]);

  const totalPoints = round(
    scoreRecords.reduce((sum, record) => sum + record.effectivePoints, 0),
  );
  const tripCount = tripLeaders.length;
  const tripDays = round(
    tripLeaders.reduce((sum, record) => sum + record.actualWorkDays, 0),
  );
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
          <h2 className="text-2xl font-semibold">奖金规则说明</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            当前为 MVP 试运营阶段，奖金分配规则仍可能调整。队长端暂不展示个人奖金测算结果，最终奖金以公司年度结算确认为准。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/leader/dashboard">返回首页</Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
          label="当前积分年度"
          value={scoreYear.name}
          description={`${formatDate(scoreYear.startDate)} - ${formatDate(scoreYear.endDate)}`}
        />
        <Card
          icon={<Award className="h-5 w-5 text-primary" />}
          label="我的有效积分"
          value={formatPoints(totalPoints)}
          description="仅统计已生效积分，作废积分不计入"
        />
        <Card
          icon={<ListChecks className="h-5 w-5 text-primary" />}
          label="年度已完成带队"
          value={`${tripCount} / 8 次`}
          description={`${formatPoints(tripDays)} 天`}
        />
      </section>

      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">基础参与条件</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <InfoBlock label="年度带队次数" value={`${tripCount} / 8 次`} />
          <InfoBlock label="年度带队天数" value={`${formatPoints(tripDays)} 天`} />
          <InfoBlock label="当前有效积分" value={formatPoints(totalPoints)} />
          <div>
            <p className="text-muted-foreground">基础参与条件</p>
            <Badge className="mt-1" variant={bonusEligible ? "secondary" : "outline"}>
              {bonusEligible ? "已达到" : "暂未达到"}
            </Badge>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-muted/20 p-5 text-sm shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Info className="h-5 w-5 text-primary" />
          试运营说明
        </h3>
        <div className="mt-3 space-y-2 leading-6 text-muted-foreground">
          <p>1. 队长端当前只展示积分和基础参与条件，不展示个人预计奖金金额。</p>
          <p>2. 年度完成带队次数达到 8 次、有效积分大于 0，且无暂停、离职、严重投诉、虚假行为或红线行为时，才具备基础参与条件。</p>
          <p>3. 实习队长可参与试运营奖金测算；节假日积分计入有效积分，但暂不设置节假日出勤硬性门槛。</p>
          <p>4. 奖金池、奖金测算和最终发放以公司后台确认和年度结算为准。</p>
          <p>5. 如发现积分、带队次数或档案状态异常，请联系队长主管核对。</p>
        </div>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
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

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
