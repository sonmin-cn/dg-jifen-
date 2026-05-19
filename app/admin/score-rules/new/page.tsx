import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RULE_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { ScoreRuleForm } from "@/app/admin/score-rules/ScoreRuleForm";

export default async function AdminScoreRuleNewPage() {
  await requireRole(SCORE_RULE_MANAGEMENT_ROLES, "/admin/score-rules/new");

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">新增积分规则</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            新增规则后会返回积分规则列表，历史积分不会受新规则影响。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/score-rules">返回规则列表</Link>
        </Button>
      </div>
      <ScoreRuleForm mode="create" />
    </div>
  );
}
