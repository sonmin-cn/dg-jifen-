import Link from "next/link";
import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { ADMIN_ROLES, requireRole } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole(ADMIN_ROLES, "/admin");
  const [pendingScoreApplications, pendingBindRequests] = await Promise.all([
    prisma.scoreApplication.count({ where: { status: "PENDING" } }),
    prisma.leaderBindRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {user.name} · {user.role}
            </p>
            <h1 className="mt-1 text-3xl font-semibold">管理后台</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/data-check">数据核对</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/score-rules">积分规则</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/score-adjustments">专项加分</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/score-ranking">积分排行榜</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/score-years">积分年度</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/bonus-settlement">奖金测算</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/score-records">积分台账</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/violations">违规扣分</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link className="relative" href="/admin/score-applications">
                积分申请
                <NavCount count={pendingScoreApplications} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link className="relative" href="/admin/leader-bind-requests">
                绑定审核
                <NavCount count={pendingBindRequests} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">首页</Link>
            </Button>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

function NavCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold leading-none text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
