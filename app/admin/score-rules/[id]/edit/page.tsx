import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RULE_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { ScoreRuleForm } from "@/app/admin/score-rules/ScoreRuleForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminScoreRuleEditPage({ params }: PageProps) {
  await requireRole(SCORE_RULE_MANAGEMENT_ROLES, "/admin/score-rules/:id/edit");
  const { id } = await params;
  const rule = await prisma.scoreRule.findUnique({ where: { id } });

  if (!rule) {
    notFound();
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">编辑积分规则</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            修改规则不会影响历史 ScoreRecord，因为历史积分已保存规则快照。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/score-rules">返回规则列表</Link>
        </Button>
      </div>
      <ScoreRuleForm mode="edit" rule={rule} />
    </div>
  );
}
