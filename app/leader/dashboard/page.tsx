import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, FilePlus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { getLeaderBindingState } from "@/lib/services/leader-binding";

const quickCards = [
  {
    title: "我的积分",
    value: "0",
    description: "后续展示当前年度总积分与有效积分。",
    icon: Award,
  },
  {
    title: "积分申请",
    value: "待接入",
    description: "朋友圈、小红书、带教复盘等申请入口。",
    icon: FilePlus,
  },
  {
    title: "申请记录",
    value: "0",
    description: "后续展示待审核、已通过与已驳回记录。",
    icon: ListChecks,
  },
];

export default async function LeaderDashboardPage() {
  const user = await requireRole(["LEADER"], "/leader/dashboard");
  const bindingState = await getLeaderBindingState(user.id);

  if (!bindingState.isBound) {
    redirect("/leader/bind");
  }

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-3">
      {quickCards.map((card) => (
        <article
          className="rounded-lg border bg-card p-5 shadow-sm"
          key={card.title}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-medium">{card.title}</h2>
            <card.icon className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 text-2xl font-semibold">{card.value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {card.description}
          </p>
          {card.title === "我的积分" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/leader/profile">查看档案</Link>
            </Button>
          ) : null}
        </article>
      ))}
    </section>
  );
}
