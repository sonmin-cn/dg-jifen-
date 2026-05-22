import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, FilePlus, FileText, ListChecks, Trophy, TrendingUp, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import {
  SCORE_CATEGORY_LABELS,
  SCORE_DIRECTION_LABELS,
} from "@/lib/constants/scores";
import { getLeaderScoreSummary } from "@/lib/services/leader-scores";

export default async function LeaderDashboardPage() {
  const user = await requireRole(["LEADER"], "/leader/dashboard");
  const summary = await getLeaderScoreSummary(user.id);

  if (!summary.leader) {
    redirect("/leader/bind");
  }

  const cards = [
    {
      title: "我的积分",
      value: formatPoints(summary.totalPoints),
      description: summary.activeScoreYear?.name || "暂无 ACTIVE 积分年度",
      icon: Award,
    },
    {
      title: "基础带队积分",
      value: formatPoints(summary.baseTripPoints),
      description: "已生成的基础带队积分合计",
      icon: TrendingUp,
    },
    {
      title: "积分记录数",
      value: String(summary.recordCount),
      description: `加分 ${formatPoints(summary.addPoints)} / 扣分 ${formatPoints(summary.deductPoints)}`,
      icon: ListChecks,
    },
    {
      title: "奖金规则说明",
      value: "查看",
      description: "查看试运营阶段奖金规则说明和基础参与条件",
      icon: WalletCards,
    },
    {
      title: "积分榜",
      value: "前50",
      description: "查看当前年度前 50 名积分榜",
      icon: Trophy,
    },
    {
      title: "积分申请",
      value: "提交",
      description: "朋友圈、小红书、老队员复购加分申请",
      icon: FilePlus,
    },
  ];

  return (
    <div className="mt-6 space-y-5 md:mt-8 md:space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            className="rounded-lg border bg-card p-4 shadow-sm md:p-5"
            key={card.title}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-medium">{card.title}</h2>
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-2xl font-semibold md:text-3xl">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {card.description}
            </p>
            {card.title === "积分申请" ? (
              <div className="mt-4 grid gap-2 sm:flex">
                <Button className="h-11 w-full sm:w-auto" size="sm" asChild>
                  <Link href="/leader/applications/new">提交申请</Link>
                </Button>
                <Button className="h-11 w-full sm:w-auto" size="sm" variant="outline" asChild>
                  <Link href="/leader/applications">申请记录</Link>
                </Button>
              </div>
            ) : null}
            {card.title === "奖金规则说明" ? (
              <div className="mt-4">
                <Button className="h-11 w-full sm:w-auto" size="sm" variant="outline" asChild>
                  <Link href="/leader/bonus">查看规则说明</Link>
                </Button>
              </div>
            ) : null}
            {card.title === "积分榜" ? (
              <div className="mt-4">
                <Button className="h-11 w-full sm:w-auto" size="sm" variant="outline" asChild>
                  <Link href="/leader/ranking">查看积分榜</Link>
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 text-primary" />
              最近积分记录
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              仅展示当前登录队长在当前积分年度下的有效积分。
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Button className="h-11 w-full sm:w-auto" variant="outline" asChild>
              <Link href="/leader/scores">查看积分明细</Link>
            </Button>
          </div>
        </div>

        {summary.recentRecords.length > 0 ? (
          <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <Th>日期</Th>
                  <Th>积分项目</Th>
                  <Th>分类</Th>
                  <Th>加分/扣分</Th>
                  <Th>分值</Th>
                  <Th>关联团期</Th>
                </tr>
              </thead>
              <tbody>
                {summary.recentRecords.map((record) => (
                  <tr className="border-t" key={record.id}>
                    <Td>{formatDate(record.occurredAt)}</Td>
                    <Td className="font-medium">{record.item}</Td>
                    <Td>{SCORE_CATEGORY_LABELS[record.category]}</Td>
                    <Td>
                      <Badge variant={record.direction === "ADD" ? "secondary" : "outline"}>
                        {SCORE_DIRECTION_LABELS[record.direction]}
                      </Badge>
                    </Td>
                    <Td className="font-semibold">{formatSignedPoints(record.effectivePoints)}</Td>
                    <Td>{record.trip?.routeName || "未关联团期"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {summary.recentRecords.map((record) => (
              <article className="rounded-md border bg-background p-4" key={record.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{record.item}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(record.occurredAt)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{formatSignedPoints(record.effectivePoints)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">{SCORE_CATEGORY_LABELS[record.category]}</Badge>
                  <Badge variant={record.direction === "ADD" ? "secondary" : "outline"}>
                    {SCORE_DIRECTION_LABELS[record.direction]}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  关联团期：{record.trip?.routeName || "未关联团期"}
                </p>
              </article>
            ))}
          </div>
          </>
        ) : (
          <p className="rounded-md border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            暂无积分记录
          </p>
        )}
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatSignedPoints(value: number) {
  if (value === 0) {
    return "0";
  }

  return `${value > 0 ? "+" : "-"}${formatPoints(Math.abs(value))}`;
}
