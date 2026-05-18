import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import {
  SCORE_APPLICATION_STATUS_LABELS,
  getApplicationTypeLabel,
} from "@/lib/constants/score-applications";
import {
  getLeaderApplications,
  parseApplicationEvidence,
} from "@/lib/services/score-applications";

export default async function LeaderApplicationsPage() {
  const user = await requireRole(["LEADER"], "/leader/applications");
  const { leader, applications } = await getLeaderApplications(user.id);

  if (!leader) {
    redirect("/leader/bind");
  }

  return (
    <div className="mt-6 space-y-5 md:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">我的加分申请</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            查看你提交的加分申请和后台审核结果。
          </p>
        </div>
        <Button className="h-11 w-full sm:w-auto" asChild>
          <Link href="/leader/applications/new">提交加分申请</Link>
        </Button>
      </div>

      <section className="hidden overflow-x-auto rounded-lg border bg-card shadow-sm md:block">
        <table className="min-w-[1000px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>提交时间</Th>
              <Th>申请规则</Th>
              <Th>规则编码</Th>
              <Th>关联团期</Th>
              <Th>图片证明</Th>
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
                  <Td className="font-medium">{getApplicationRuleName(application)}</Td>
                  <Td className="font-mono">{application.ruleCode || application.rule?.code || "-"}</Td>
                  <Td>{application.trip?.routeName || "未关联团期"}</Td>
                  <Td>
                    {hasEvidenceImages(application) ? (
                      <Badge variant="secondary">有图片证明</Badge>
                    ) : (
                      "-"
                    )}
                  </Td>
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
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={9}>
                  暂无申请记录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="grid gap-3 md:hidden">
        {applications.length > 0 ? (
          applications.map((application) => (
            <article className="rounded-lg border bg-card p-4 shadow-sm" key={application.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {getApplicationRuleName(application)}
                  </p>
                  <h3 className="mt-1 font-medium">{application.ruleCode || application.rule?.code || "-"}</h3>
                </div>
                <Badge variant={application.status === "PENDING" ? "secondary" : "outline"}>
                  {SCORE_APPLICATION_STATUS_LABELS[application.status]}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <InfoLine label="关联团期" value={application.trip?.routeName || "未关联团期"} />
                <InfoLine label="图片证明" value={hasEvidenceImages(application) ? "有图片证明" : "未上传图片证明"} />
                <InfoLine label="申请分值" value={`+${formatPoints(application.requestedPoints)}`} />
                <InfoLine label="提交时间" value={formatDateTime(application.submittedAt)} />
                <InfoLine label="审核时间" value={formatDateTime(application.reviewedAt)} />
                <InfoLine label="拒绝原因" value={application.rejectReason} />
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无申请记录。
          </p>
        )}
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

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="text-muted-foreground">
      {label}：<span className="break-words text-foreground">{value || "-"}</span>
    </p>
  );
}

function getApplicationRuleName(application: {
  title?: string | null;
  type: Parameters<typeof getApplicationTypeLabel>[0];
  rule?: { name: string | null } | null;
}) {
  return application.rule?.name || application.title || getApplicationTypeLabel(application.type);
}

function hasEvidenceImages(application: {
  evidenceText?: string | null;
  evidenceUrl?: string | null;
  evidenceJson?: string | null;
}) {
  return parseApplicationEvidence(application).images.length > 0;
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
