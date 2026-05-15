import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import {
  SCORE_APPLICATION_STATUS_LABELS,
  getApplicationTypeLabel,
} from "@/lib/constants/score-applications";
import { getLeaderApplications } from "@/lib/services/score-applications";

export default async function LeaderApplicationsPage() {
  const user = await requireRole(["LEADER"], "/leader/applications");
  const { leader, applications } = await getLeaderApplications(user.id);

  if (!leader) {
    redirect("/leader/bind");
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">我的加分申请</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            查看你提交的加分申请和后台审核结果。
          </p>
        </div>
        <Button asChild>
          <Link href="/leader/applications/new">提交加分申请</Link>
        </Button>
      </div>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1000px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>提交时间</Th>
              <Th>申请类型</Th>
              <Th>申请标题</Th>
              <Th>关联团期</Th>
              <Th>申请分值</Th>
              <Th>审核状态</Th>
              <Th>审核时间</Th>
              <Th>拒绝原因</Th>
            </tr>
          </thead>
          <tbody>
            {applications.length > 0 ? (
              applications.map((application) => (
                <tr className="border-t" key={application.id}>
                  <Td>{formatDateTime(application.submittedAt)}</Td>
                  <Td>{getApplicationTypeLabel(application.type)}</Td>
                  <Td className="font-medium">{application.title || "-"}</Td>
                  <Td>{application.trip?.routeName || "-"}</Td>
                  <Td>+{formatPoints(application.requestedPoints)}</Td>
                  <Td>
                    <Badge variant={application.status === "PENDING" ? "secondary" : "outline"}>
                      {SCORE_APPLICATION_STATUS_LABELS[application.status]}
                    </Badge>
                  </Td>
                  <Td>{formatDateTime(application.reviewedAt)}</Td>
                  <Td>{application.rejectReason || "-"}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={8}>
                  暂无申请记录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className || ""}`}>{children}</td>;
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
