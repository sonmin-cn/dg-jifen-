import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES, SCORE_RECORD_READ_ROLES } from "@/lib/auth/roles";
import {
  SCORE_APPLICATION_STATUS_LABELS,
  getApplicationTypeLabel,
} from "@/lib/constants/score-applications";
import {
  getAdminScoreApplicationDetail,
  parseApplicationEvidence,
} from "@/lib/services/score-applications";
import { getEvidenceImageProxyUrl } from "@/lib/storage/evidence-url";
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

  const evidence = parseApplicationEvidence(application);

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/score-applications">返回申请列表</Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold">{getApplicationRuleName(application)}</h2>
            <Badge variant={application.status === "PENDING" ? "secondary" : "outline"}>
              {SCORE_APPLICATION_STATUS_LABELS[application.status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {application.leader.realName}
            {application.leader.nickname ? `（${application.leader.nickname}）` : ""} ·{" "}
            {application.ruleCode || application.rule?.code || getApplicationTypeLabel(application.type)}
          </p>
        </div>
        {canReview && application.status === "PENDING" ? (
          <div className="w-full max-w-sm rounded-lg border bg-card p-4 shadow-sm">
            <ApplicationReviewActions applicationId={application.id} />
          </div>
        ) : null}
      </div>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-4">
        <Info label="申请规则" value={getApplicationRuleName(application)} />
        <Info label="规则编码" value={application.ruleCode || application.rule?.code} />
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
          <Info label="证明说明" value={evidence.text} wide />
          <Info label="证明链接" value={evidence.url} wide />
          <Info label="老用户姓名" value={application.repurchaseCustomerName} wide />
          {application.orderNo ? (
            <Info label="历史复购订单号" value={application.orderNo} wide />
          ) : null}
        </div>
        <div className="mt-5">
          <p className="text-muted-foreground">图片证明</p>
          {evidence.images.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {evidence.images.map((image) => {
                const displayUrl = getEvidenceImageProxyUrl(image.url, "score-applications");

                return (
                  <a
                    className="overflow-hidden rounded-lg border bg-background hover:border-primary"
                    href={displayUrl}
                    key={image.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="证明图片"
                      className="h-40 w-full object-cover"
                      src={displayUrl}
                    />
                    <div className="border-t p-2 text-xs text-muted-foreground">
                      <p className="truncate">{image.filename}</p>
                      <p>{formatFileSize(image.size)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 font-medium">未上传图片证明</p>
          )}
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

function getApplicationRuleName(application: {
  title?: string | null;
  type: Parameters<typeof getApplicationTypeLabel>[0];
  rule?: { name: string | null } | null;
}) {
  return application.rule?.name || application.title || getApplicationTypeLabel(application.type);
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return formatDateTimeCN(value);
}

function formatDate(value: Date) {
  return formatDateCN(value);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatNullablePoints(value: number | null) {
  if (value === null) return "-";
  return `+${formatPoints(value)}`;
}

function formatFileSize(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${Math.max(Math.round(value / 1024), 1)} KB`;
}
