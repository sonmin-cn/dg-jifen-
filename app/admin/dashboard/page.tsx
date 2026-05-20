import Link from "next/link";
import type { UserRole } from "@prisma/client";
import {
  Activity,
  ClipboardCheck,
  ClipboardList,
  Database,
  FilePlus2,
  ListChecks,
  ShieldAlert,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLES, requireRole } from "@/lib/auth/permissions";
import {
  BONUS_READ_ROLES,
  DATA_CHECK_READ_ROLES,
  LEADER_MANAGEMENT_ROLES,
  SCORE_ADJUSTMENT_READ_ROLES,
  SCORE_RANKING_READ_ROLES,
  SCORE_RECORD_READ_ROLES,
  SCORE_RULE_READ_ROLES,
  TRIP_READ_ROLES,
  VIOLATION_READ_ROLES,
} from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

const SCORE_APPLICATION_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "LEADER_MANAGER",
  "ADMIN",
  "FINANCE",
  "EXECUTIVE_VIEWER",
];

const groups = [
  {
    title: "日常处理",
    modules: [
      {
        title: "数据核对",
        description: "检查账号绑定、团期积分、申请审核、积分异常与奖金测算风险。",
        href: "/admin/data-check",
        button: "开始核对",
        icon: Activity,
        roles: DATA_CHECK_READ_ROLES,
      },
      {
        title: "待审核积分申请",
        description: "审核队长提交的加分申请。",
        href: "/admin/score-applications",
        button: "进入审核",
        icon: ClipboardCheck,
        roles: SCORE_APPLICATION_READ_ROLES,
        countKey: "pendingScoreApplications" as const,
      },
      {
        title: "待审核绑定申请",
        description: "处理队长账号与队长档案绑定。",
        href: "/admin/leader-bind-requests",
        button: "进入审核",
        icon: ClipboardCheck,
        roles: LEADER_MANAGEMENT_ROLES,
        countKey: "pendingBindRequests" as const,
      },
      {
        title: "团期管理",
        description: "维护团期、带队人员和实际带队天数。",
        href: "/admin/trips",
        button: "进入管理",
        icon: ClipboardList,
        roles: TRIP_READ_ROLES,
      },
      {
        title: "队长管理",
        description: "维护队长基础信息、状态、等级和账号绑定。",
        href: "/admin/leaders",
        button: "进入管理",
        icon: Users,
        roles: LEADER_MANAGEMENT_ROLES,
      },
    ],
  },
  {
    title: "积分操作",
    modules: [
      {
        title: "积分台账",
        description: "统一查看有效、作废、申请和扣分来源。",
        href: "/admin/score-records",
        button: "进入台账",
        icon: Database,
        roles: SCORE_RECORD_READ_ROLES,
      },
      {
        title: "专项加分",
        description: "为优质素材、带教、推荐、特殊贡献等场景补录积分。",
        href: "/admin/score-adjustments",
        button: "进入补录",
        icon: FilePlus2,
        roles: SCORE_ADJUSTMENT_READ_ROLES,
      },
      {
        title: "违规扣分",
        description: "录入违规、投诉和安全问题扣分。",
        href: "/admin/violations",
        button: "进入扣分",
        icon: ShieldAlert,
        roles: VIOLATION_READ_ROLES,
      },
      {
        title: "积分规则",
        description: "维护加分、扣分和专项积分规则。",
        href: "/admin/score-rules",
        button: "进入规则",
        icon: ListChecks,
        roles: SCORE_RULE_READ_ROLES,
      },
    ],
  },
  {
    title: "统计结算",
    modules: [
      {
        title: "积分排行榜",
        description: "查看当前年度队长积分排名与奖金资格。",
        href: "/admin/score-ranking",
        button: "查看排行",
        icon: Trophy,
        roles: SCORE_RANKING_READ_ROLES,
      },
      {
        title: "奖金池",
        description: "维护积分年度奖金池注入记录。",
        href: "/admin/bonus-pool",
        button: "进入奖金池",
        icon: WalletCards,
        roles: BONUS_READ_ROLES,
      },
      {
        title: "奖金测算",
        description: "进行年度奖金分配测算并查看历史结果。",
        href: "/admin/bonus-settlement",
        button: "进入测算",
        icon: WalletCards,
        roles: BONUS_READ_ROLES,
      },
    ],
  },
];

export default async function AdminDashboardPage() {
  const user = await requireRole(ADMIN_ROLES, "/admin/dashboard");
  const [pendingScoreApplications, pendingBindRequests] = await Promise.all([
    prisma.scoreApplication.count({ where: { status: "PENDING" } }),
    prisma.leaderBindRequest.count({ where: { status: "PENDING" } }),
  ]);
  const counts = { pendingScoreApplications, pendingBindRequests };

  return (
    <div className="mt-8 space-y-8">
      {groups.map((group) => {
        const visibleModules = group.modules.filter((module) =>
          module.roles.includes(user.role),
        );
        if (visibleModules.length === 0) return null;

        return (
          <section key={group.title}>
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {visibleModules.map((module) => {
                const count = module.countKey ? counts[module.countKey] : 0;
                return (
                  <article
                    className="relative rounded-lg border bg-card p-5 shadow-sm"
                    key={module.title}
                  >
                    <module.icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold">
                      {module.title}
                      <ModuleCount count={count} />
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {module.description}
                    </p>
                    <Button className="mt-4" size="sm" variant="outline" asChild>
                      <Link href={module.href}>{module.button}</Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ModuleCount({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold leading-none text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
