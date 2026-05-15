import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { getLeaderApplicationTrips, getApplicationTypeRules } from "@/lib/services/score-applications";
import { ApplicationCreateForm } from "@/app/leader/applications/new/ApplicationCreateForm";

export default async function NewLeaderApplicationPage() {
  const user = await requireRole(["LEADER"], "/leader/applications/new");
  const [{ leader, trips }, rules] = await Promise.all([
    getLeaderApplicationTrips(user.id),
    getApplicationTypeRules(),
  ]);

  if (!leader) {
    redirect("/leader/bind");
  }

  const rulePreview = Object.fromEntries(
    Object.entries(rules).map(([type, rule]) => [
      type,
      {
        points: rule?.points ?? null,
        name: rule?.name ?? null,
      },
    ]),
  );

  return (
    <div className="mt-6 md:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">提交加分申请</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            选择申请类型并填写证明材料，审核通过后将自动生成积分记录。
          </p>
        </div>
        <Button className="h-11 w-full sm:w-auto" variant="outline" asChild>
          <Link href="/leader/applications">申请记录</Link>
        </Button>
      </div>
      <ApplicationCreateForm rulePreview={rulePreview} trips={trips} />
    </div>
  );
}
