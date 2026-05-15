import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RECORD_READ_ROLES } from "@/lib/auth/roles";
import {
  SCORE_CATEGORY_LABELS,
  SCORE_DIRECTION_LABELS,
  SCORE_RECORD_STATUS_LABELS,
} from "@/lib/constants/scores";
import {
  formatScorePoints,
  getAdminScoreRecordDetail,
  parseRuleSnapshotJson,
} from "@/lib/services/score-records";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminScoreRecordDetailPage({ params }: PageProps) {
  await requireRole(SCORE_RECORD_READ_ROLES, "/admin/score-records/:id");
  const { id } = await params;
  const record = await getAdminScoreRecordDetail(id);

  if (!record) {
    notFound();
  }

  const snapshot = parseRuleSnapshotJson(record.ruleSnapshotJson);

  return (
    <div className="py-8">
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/score-records">返回积分台账</Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">{record.item}</h2>
          <Badge variant={record.direction === "ADD" ? "secondary" : "outline"}>
            {SCORE_DIRECTION_LABELS[record.direction]}
          </Badge>
          <Badge variant="outline">{SCORE_RECORD_STATUS_LABELS[record.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {record.leader.realName}
          {record.leader.nickname ? `（${record.leader.nickname}）` : ""} ·{" "}
          {record.scoreYear.name}
        </p>
      </div>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-4">
        <Info label="队长" value={record.leader.realName} />
        <Info label="积分年度" value={record.scoreYear.name} />
        <Info label="积分项目" value={record.item} />
        <Info label="分类" value={SCORE_CATEGORY_LABELS[record.category]} />
        <Info label="方向" value={SCORE_DIRECTION_LABELS[record.direction]} />
        <Info label="原始分值" value={formatPlainPoints(record.rawPoints)} />
        <Info
          label="有效分值"
          value={formatScorePoints(
            record.direction === "DEDUCT" && record.effectivePoints > 0
              ? -record.effectivePoints
              : record.effectivePoints,
          )}
        />
        <Info label="状态" value={SCORE_RECORD_STATUS_LABELS[record.status]} />
        <Info label="发生时间" value={formatDateTime(record.occurredAt)} />
        <Info label="审核人 ID" value={record.approvedBy} />
        <Info label="审核时间" value={formatDateTime(record.approvedAt)} />
        <Info label="备注" value={record.remark} wide />
      </section>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-3">
        <Info label="关联团期" value={record.trip?.routeName} />
        <Info label="关联申请 applicationId" value={record.applicationId} />
        <Info label="关联事件 violationEventId" value={record.violationEventId} />
        <Info label="来源类型" value={record.sourceType} />
        <Info label="来源 ID" value={record.sourceId} wide />
      </section>

      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h3 className="text-lg font-semibold">规则快照</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <Info label="ruleId" value={record.ruleId} />
          <Info label="ruleCode" value={record.ruleCode || record.rule?.code} />
          <Info label="ruleName" value={record.ruleName || record.rule?.name} />
          <Info label="ruleVersion" value={record.ruleVersion?.toString()} />
          <Info label="rulePoints" value={formatNullablePoints(record.rulePoints)} />
        </div>
        <pre className="mt-4 max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-6">
          {snapshot || "无规则快照"}
        </pre>
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
  if (!value) {
    return "-";
  }

  return value.toISOString().slice(0, 19).replace("T", " ");
}

function formatPlainPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatNullablePoints(value: number | null) {
  if (value === null) {
    return "-";
  }

  return formatPlainPoints(value);
}
