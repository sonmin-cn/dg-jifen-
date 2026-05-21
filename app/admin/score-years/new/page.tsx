import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_YEAR_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { ScoreYearForm } from "@/app/admin/score-years/ScoreYearForm";

export default async function AdminScoreYearNewPage() {
  await requireRole(SCORE_YEAR_MANAGEMENT_ROLES, "/admin/score-years/new");

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">新增积分年度</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            新增一个覆盖团期结束日期的 ACTIVE 积分年度后，基础带队积分即可归属到该年度。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/score-years">返回年度列表</Link>
        </Button>
      </div>
      <ScoreYearForm mode="create" />
    </div>
  );
}
