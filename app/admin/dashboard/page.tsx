import Link from "next/link";
import { Activity, ClipboardCheck, ClipboardList, Database, ShieldAlert, Trophy, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  {
    title: "队长档案",
    description: "维护队长基础信息、状态、等级、区域和转正情况。",
    icon: Users,
  },
  {
    title: "团期管理",
    description: "维护团期、带队人员和实际带队天数。",
    icon: ClipboardList,
  },
  {
    title: "积分台账",
    description: "统一查看已生效积分、申请来源和审核信息。",
    icon: Database,
  },
  {
    title: "积分排行榜",
    description: "查看当前年度队长积分排名与奖金资格。",
    icon: Trophy,
  },
  {
    title: "积分申请审核",
    description: "审核队长提交的朋友圈、小红书和复购加分申请。",
    icon: ClipboardCheck,
  },
  {
    title: "违规扣分",
    description: "录入违规、投诉和安全问题扣分。",
    icon: ShieldAlert,
  },
  {
    title: "奖金测算",
    description: "维护奖金池并进行年度奖金分配测算。",
    icon: WalletCards,
  },
  {
    title: "试运营数据核对",
    description: "检查账号绑定、团期积分、申请审核、积分异常与奖金测算风险。",
    icon: Activity,
  },
];

export default function AdminDashboardPage() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {modules.map((module) => (
        <article
          className="rounded-lg border bg-card p-5 shadow-sm"
          key={module.title}
        >
          <module.icon className="h-5 w-5 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">{module.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {module.description}
          </p>
          {module.title === "队长档案" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/admin/leaders">进入管理</Link>
            </Button>
          ) : null}
          {module.title === "团期管理" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/admin/trips">进入管理</Link>
            </Button>
          ) : null}
          {module.title === "积分台账" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/admin/score-records">进入台账</Link>
            </Button>
          ) : null}
          {module.title === "积分排行榜" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/admin/score-ranking">查看排行</Link>
            </Button>
          ) : null}
          {module.title === "积分申请审核" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/admin/score-applications">进入审核</Link>
            </Button>
          ) : null}
          {module.title === "违规扣分" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/admin/violations">进入扣分</Link>
            </Button>
          ) : null}
          {module.title === "奖金测算" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/bonus-pool">奖金池</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/bonus-settlement">测算</Link>
              </Button>
            </div>
          ) : null}
          {module.title === "试运营数据核对" ? (
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link href="/admin/data-check">开始核对</Link>
            </Button>
          ) : null}
        </article>
      ))}
    </section>
  );
}
