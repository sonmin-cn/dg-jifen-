import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  getLeaderApplicationRules,
  getLeaderApplicationTrips,
  parseApplicationEvidence,
} from "@/lib/services/score-applications";
import {
  ApplicationCreateForm,
  type ApplicationInitialValues,
} from "@/app/leader/applications/new/ApplicationCreateForm";

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function NewLeaderApplicationPage({ searchParams }: PageProps) {
  const user = await requireRole(["LEADER"], "/leader/applications/new");
  const { from } = await searchParams;
  const [{ leader, trips }, rules] = await Promise.all([
    getLeaderApplicationTrips(user.id),
    getLeaderApplicationRules(),
  ]);

  if (!leader) {
    redirect("/leader/bind");
  }

  let initial: ApplicationInitialValues | null = null;
  let resubmitNotice: string | null = null;

  if (from) {
    const original = await prisma.scoreApplication.findFirst({
      where: {
        id: from,
        leaderId: leader.id,
        status: { in: ["NEEDS_MORE_INFO", "REJECTED"] },
      },
    });

    if (original) {
      const evidence = parseApplicationEvidence(original);
      // 原申请可能挂在旧版本规则上，按 ruleCode 映射到当前可申请的规则选项
      const matchedRule =
        rules.find((rule) => rule.id === original.ruleId) ||
        rules.find((rule) => rule.code === original.ruleCode) ||
        null;

      initial = {
        resubmitOfId: original.id,
        ruleId: matchedRule?.id || "",
        tripId: original.tripId || "",
        description: original.description || "",
        evidenceText: evidence.text || "",
        evidenceUrl: evidence.url || "",
        repurchaseCustomerName: original.repurchaseCustomerName || "",
        evidenceImages: evidence.images,
      };
      resubmitNotice = original.rejectReason;
    }
  }

  return (
    <div className="mt-6 md:mt-8">
      <BackButton fallbackHref="/leader/dashboard" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">
            {initial ? "重新提交加分申请" : "提交加分申请"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            选择申请类型并填写证明材料，审核通过后将自动生成积分记录。
          </p>
        </div>
        <Button className="h-11 w-full sm:w-auto" variant="outline" asChild>
          <Link href="/leader/applications">申请记录</Link>
        </Button>
      </div>
      {initial ? (
        <p className="mt-4 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          已为你带入原申请内容，补充或修改后重新提交；提交成功后原申请自动取消。
          {resubmitNotice ? `审核意见：${resubmitNotice}` : ""}
        </p>
      ) : null}
      <ApplicationCreateForm initial={initial} rules={rules} trips={trips} />
    </div>
  );
}
