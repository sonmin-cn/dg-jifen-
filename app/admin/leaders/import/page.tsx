import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { LeaderImportClient } from "@/app/admin/leaders/import/LeaderImportClient";

export default async function AdminLeaderImportPage() {
  await requireRole(LEADER_MANAGEMENT_ROLES, "/admin/leaders/import");

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">导入队长数据</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            读取第 2 行字段名，从第 3 行开始预览并确认导入队长档案。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/leaders">返回队长列表</Link>
        </Button>
      </div>

      <LeaderImportClient />
    </div>
  );
}
