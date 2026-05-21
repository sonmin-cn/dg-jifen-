import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_YEAR_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { ScoreYearForm } from "@/app/admin/score-years/ScoreYearForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminScoreYearEditPage({ params }: PageProps) {
  await requireRole(SCORE_YEAR_MANAGEMENT_ROLES, "/admin/score-years/:id/edit");
  const { id } = await params;
  const scoreYear = await prisma.scoreYear.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          scoreRecords: true,
        },
      },
    },
  });

  if (!scoreYear) {
    notFound();
  }

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">编辑积分年度</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            修改已有积分年度前，请确认该年度的历史积分记录仍能被新的日期范围覆盖。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/score-years">返回年度列表</Link>
        </Button>
      </div>
      <ScoreYearForm
        mode="edit"
        scoreYear={{
          ...scoreYear,
          scoreRecordCount: scoreYear._count.scoreRecords,
        }}
      />
    </div>
  );
}
