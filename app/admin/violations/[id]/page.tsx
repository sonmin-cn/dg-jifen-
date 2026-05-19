import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import { VIOLATION_READ_ROLES } from "@/lib/auth/roles";
import { SCORE_CATEGORY_LABELS } from "@/lib/constants/scores";
import {
  VIOLATION_SEVERITY_LABELS,
  VIOLATION_STATUS_LABELS,
  getViolationRuleLabel,
} from "@/lib/constants/violations";
import { getAdminViolationDetail } from "@/lib/services/violations";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ViolationDetailPage({ params }: PageProps) {
  await requireRole(VIOLATION_READ_ROLES, "/admin/violations/:id");
  const { id } = await params;
  const event = await getAdminViolationDetail(id);

  if (!event) {
    notFound();
  }

  const scoreRecord = event.scoreRecords[0];

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/violations">返回扣分列表</Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">{event.title}</h2>
          <Badge variant={event.status === "EFFECTIVE" ? "secondary" : "outline"}>
            {VIOLATION_STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {event.leader.realName}
          {event.leader.nickname ? `（${event.leader.nickname}）` : ""} ·{" "}
          {getViolationRuleLabel(event.ruleCode)}
        </p>
      </div>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-4">
        <Info label="扣分类型" value={getViolationRuleLabel(event.ruleCode)} />
        <Info label="分类" value={event.rule?.category ? SCORE_CATEGORY_LABELS[event.rule.category] : "-"} />
        <Info label="严重程度" value={VIOLATION_SEVERITY_LABELS[event.severity]} />
        <Info label="扣分分值" value={formatPoints(event.points)} />
        <Info label="发生时间" value={formatDateTime(event.occurredAt)} />
        <Info label="处理人 ID" value={event.handledBy || event.approvedBy} />
        <Info label="处理时间" value={formatDateTime(event.handledAt || event.approvedAt)} />
        <Info label="积分年度" value={event.scoreYear.name} />
        <Info label="事件说明" value={event.description} wide />
        <Info label="处理备注" value={event.remark} wide />
      </section>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-3">
        <Info label="队长" value={event.leader.realName} />
        <Info label="队长昵称" value={event.leader.nickname} />
        <Info label="手机号" value={event.leader.phone ? `****${event.leader.phone.slice(-4)}` : "-"} />
        <Info label="关联团期" value={event.trip?.routeName || "未关联团期"} />
        <Info label="团期状态" value={event.trip?.status} />
        <Info label="团期日期" value={event.trip ? `${formatDate(event.trip.startDate)} 至 ${formatDate(event.trip.endDate)}` : "-"} />
      </section>

      <section className="mb-5 rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">证据</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Info label="证据说明" value={event.evidenceText} wide />
          <Info label="证据链接" value={event.evidenceUrl} wide />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">积分记录与规则</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Info label="ScoreRecord" value={event.scoreRecordId || scoreRecord?.id} />
          <Info label="ruleCode" value={event.ruleCode} />
          <Info label="ruleName" value={event.rule?.name} />
          <Info label="ruleVersion" value={event.rule?.version?.toString()} />
        </div>
        {scoreRecord ? (
          <div className="mt-4">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/score-records/${scoreRecord.id}`}>查看积分台账详情</Link>
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Info({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
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
  if (value === 0) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
