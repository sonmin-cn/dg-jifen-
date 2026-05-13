import Link from "next/link";
import { ClipboardList, Database, Users, WalletCards } from "lucide-react";
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
    title: "奖金测算",
    description: "维护奖金池并进行年度奖金分配测算。",
    icon: WalletCards,
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
        </article>
      ))}
    </section>
  );
}
