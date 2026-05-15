import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { VIOLATION_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { getViolationRulePreview } from "@/lib/services/violations";
import { ViolationCreateForm } from "@/app/admin/violations/ViolationCreateForm";

export default async function NewViolationPage() {
  await requireRole(VIOLATION_MANAGEMENT_ROLES, "/admin/violations/new");
  const [leaders, trips, rulePreview] = await Promise.all([
    prisma.leader.findMany({
      orderBy: { realName: "asc" },
      select: { id: true, realName: true, nickname: true, phone: true },
    }),
    prisma.trip.findMany({
      orderBy: { endDate: "desc" },
      select: { id: true, routeName: true, startDate: true, endDate: true },
      take: 300,
    }),
    getViolationRulePreview(),
  ]);

  return (
    <div className="py-8">
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/violations">返回扣分列表</Link>
      </Button>
      <div>
        <h2 className="text-2xl font-semibold">新增扣分事件</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          录入违规、投诉或安全事件后，系统会立即生成扣分积分记录。
        </p>
      </div>
      <ViolationCreateForm leaders={leaders} rulePreview={rulePreview} trips={trips} />
    </div>
  );
}
