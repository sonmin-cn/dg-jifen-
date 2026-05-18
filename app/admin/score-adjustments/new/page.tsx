import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_ADJUSTMENT_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { getActiveAddScoreRules } from "@/lib/services/score-adjustments";
import { ScoreAdjustmentCreateForm } from "@/app/admin/score-adjustments/new/ScoreAdjustmentCreateForm";

export default async function AdminScoreAdjustmentNewPage() {
  await requireRole(SCORE_ADJUSTMENT_MANAGEMENT_ROLES, "/admin/score-adjustments/new");
  const [leaders, scoreYears, activeYear, trips, rules] = await Promise.all([
    prisma.leader.findMany({
      orderBy: { realName: "asc" },
      select: {
        id: true,
        realName: true,
        nickname: true,
        phone: true,
        externalLeaderId: true,
        status: true,
        level: true,
      },
    }),
    prisma.scoreYear.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.scoreYear.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: { id: true },
    }),
    prisma.trip.findMany({
      orderBy: { startDate: "desc" },
      take: 200,
      select: { id: true, routeName: true, startDate: true, endDate: true },
    }),
    getActiveAddScoreRules(),
  ]);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">新增专项加分 / 积分补录</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            从当前启用的加分规则中选择一条，提交后会直接生成有效 ScoreRecord。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/score-adjustments">返回专项加分</Link>
        </Button>
      </div>

      <ScoreAdjustmentCreateForm
        defaultScoreYearId={activeYear?.id || scoreYears[0]?.id || ""}
        leaders={leaders.map((leader) => ({
          id: leader.id,
          label: `${leader.realName}${leader.nickname ? ` / ${leader.nickname}` : ""}${leader.phone ? ` / ****${leader.phone.slice(-4)}` : ""} / ${leader.status}${leader.level ? ` / ${leader.level}` : ""}`,
          searchText: `${leader.realName} ${leader.nickname || ""} ${leader.phone || ""} ${leader.externalLeaderId || ""} ${leader.status} ${leader.level || ""}`,
        }))}
        rules={rules.map((rule) => ({
          id: rule.id,
          code: rule.code,
          name: rule.name,
          points: rule.points,
          category: rule.category,
          description: rule.description,
          effectiveFrom: rule.effectiveFrom.toISOString(),
          effectiveTo: rule.effectiveTo?.toISOString() || null,
        }))}
        scoreYears={scoreYears.map((scoreYear) => ({
          id: scoreYear.id,
          label: `${scoreYear.name}${scoreYear.status === "ACTIVE" ? "（当前）" : ""}`,
        }))}
        trips={trips.map((trip) => ({
          id: trip.id,
          label: `${trip.routeName}（${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}）`,
        }))}
      />
    </div>
  );
}

function formatDate(value: Date) {
  return value.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
}
