import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES, SCORE_RECORD_READ_ROLES } from "@/lib/auth/roles";
import {
  SCORE_APPLICATION_STATUS_LABELS,
  getApplicationTypeLabel,
} from "@/lib/constants/score-applications";
import { getAdminScoreApplicationDetail } from "@/lib/services/score-applications";
import { ApplicationReviewActions } from "@/app/admin/score-applications/ApplicationReviewActions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminScoreApplicationDetailPage({ params }: PageProps) {
  const user = await requireRole(SCORE_RECORD_READ_ROLES, "/admin/score-applications/:id");
  const canReview = LEADER_MANAGEMENT_ROLES.includes(user.role);
  const { id } = await params;
  const application = await getAdminScoreApplicationDetail(id);

  if (!application) {
    notFound();
  }

  return (
    <div className="py-8">
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/score-applications">返回申请列表</Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold">{application.title || "积分申请"}</h2>
            <Badge variant={application.status === "PENDING" ? "secondary" : "outline"}>
              {SCORE_APPLICATION_STATUS_LABELS[application.status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {application.leader.realName}
            {application.leader.nickname ? `（${application.leader.nickname}）` : ""} ·{" "}
            {getApplicationTypeLabel(application.type)}
          </p>
        </div>
        {canReview && application.status === "PENDING" ? (
          <div className="w-full max-w-sm rounded-lg border bg-card p-4 shadow-sm">
            <ApplicationReviewActions applicationId={application.id} />
          </div>
        ) : null}
      </div>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-4">
        <Info label="申请类型" value={getApplicationTypeLabel(application.type)} />
        <Info label="申请分值" value={`+${formatPoints(application.requestedPoints)}`} />
        <Info label="批准分值" value={formatNullablePoints(application.approvedPoints)} />
        <Info label="积分年度" value={application.scoreYear.name} />
        <Info label="提交时间" value={formatDateTime(application.submittedAt)} />
        <Info label="审核人" value={application.reviewedBy} />
        <Info label="审核时间" value={formatDateTime(application.reviewedAt)} />
        <Info label="拒绝原因" value={application.rejectReason} />
        <Info label="申请说明" value={application.description} wide />
      </section>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-3">
        <Info label="队长" value={application.leader.realName} />
        <Info label="队长昵称" value={application.leader.nickname} />
        <Info label="手机号" value={application.leader.phone ? `****${application.leader.phone.slice(-4)}` : "-"} />
        <Info label="关联团期" value={application.trip?.routeName || "未关联团期"} />
        <Info label="团期状态" value={application.trip?.status} />
        <Info label="团期日期" value={application.trip ? `${formatDate(application.trip.startDate)} 至 ${formatDate(application.trip.endDate)}` : "-"} />
      </section>

      <section className="mb-5 rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">证明材料</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Info label="证明说明" value={application.evidenceText} wide />
          <Info label="证明链接" value={application.evidenceUrl} wide />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">规则信息</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <Info label="ruleId" value={application.ruleId} />
          <Info label="ruleCode" value={application.ruleCode || application.rule?.code} />
          <Info label="ruleName" value={application.rule?.name} />
          <Info label="ruleVersion" value={application.rule?.version?.toString()} />
          <Info label="rulePoints" value={formatNullablePoints(application.rule?.points ?? null)} />
        </div>
      </section>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value || "-"}</p>
    </div>
  );
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatNullablePoints(value: number | null) {
  if (value === null) return "-";
  return `+${formatPoints(value)}`;
}
