import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RECORD_READ_ROLES, SCORE_RECORD_VOID_ROLES } from "@/lib/auth/roles";
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
import {
  isAllowedEvidenceImageUrl,
  type EvidenceUrlScope,
} from "@/lib/storage/evidence-url";
import { VoidScoreRecordForm } from "@/app/admin/score-records/[id]/VoidScoreRecordForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminScoreRecordDetailPage({ params }: PageProps) {
  const user = await requireRole(SCORE_RECORD_READ_ROLES, "/admin/score-records/:id");
  const { id } = await params;
  const record = await getAdminScoreRecordDetail(id);

  if (!record) {
    notFound();
  }

  const snapshot = parseRuleSnapshotJson(record.ruleSnapshotJson);
  const evidenceImages = extractEvidenceImages(record.ruleSnapshotJson);
  const canVoid = SCORE_RECORD_VOID_ROLES.includes(user.role);

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/score-records">返回积分台账</Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">{record.item}</h2>
          <Badge variant={record.direction === "ADD" ? "secondary" : "outline"}>
            {SCORE_DIRECTION_LABELS[record.direction]}
          </Badge>
          <Badge variant={record.status === "VOIDED" ? "outline" : "secondary"}>
            {SCORE_RECORD_STATUS_LABELS[record.status]}
          </Badge>
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
        <div>
          <p className="text-muted-foreground">状态</p>
          <Badge className="mt-1" variant={record.status === "VOIDED" ? "outline" : "secondary"}>
            {SCORE_RECORD_STATUS_LABELS[record.status]}
          </Badge>
        </div>
        <Info label="发生时间" value={formatDateTime(record.occurredAt)} />
        <Info label="审核人 ID" value={record.approvedBy} />
        <Info label="审核时间" value={formatDateTime(record.approvedAt)} />
        <Info label="作废人 ID" value={record.voidedBy} />
        <Info label="作废时间" value={formatDateTime(record.voidedAt)} />
        <Info label="备注" value={record.remark} wide />
        <Info label="作废原因" value={record.voidReason} wide />
      </section>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-3">
        <Info label="关联团期" value={record.trip?.routeName || "未关联团期"} />
        <div>
          <p className="text-muted-foreground">关联申请 applicationId</p>
          <p className="mt-1 break-words font-medium">
            {record.applicationId ? (
              <Link className="text-primary underline-offset-4 hover:underline" href={`/admin/score-applications/${record.applicationId}`}>
                {record.applicationId}
              </Link>
            ) : (
              "-"
            )}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">关联事件 violationEventId</p>
          <p className="mt-1 break-words font-medium">
            {record.violationEventId ? (
              <Link className="text-primary underline-offset-4 hover:underline" href={`/admin/violations/${record.violationEventId}`}>
                {record.violationEventId}
              </Link>
            ) : (
              "-"
            )}
          </p>
        </div>
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

      {evidenceImages.length > 0 ? (
        <section className="mt-5 rounded-lg border bg-card p-5 text-sm shadow-sm">
          <h3 className="text-lg font-semibold">证据截图</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {evidenceImages.map((image) => (
              <a
                className="rounded-md border bg-background p-2 hover:border-primary"
                href={image.url}
                key={image.url}
                rel="noreferrer"
                target="_blank"
              >
                <img
                  alt={image.filename || "证据截图"}
                  className="h-32 w-full rounded object-cover"
                  src={image.url}
                />
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {image.filename || image.url}
                </p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5">
        {record.status === "VOIDED" ? (
          <div className="rounded-lg border bg-muted/30 p-5 text-sm shadow-sm">
            <h3 className="text-lg font-semibold">作废信息</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Info label="作废原因" value={record.voidReason} wide />
              <Info label="作废人 ID" value={record.voidedBy} />
              <Info label="作废时间" value={formatDateTime(record.voidedAt)} />
            </div>
          </div>
        ) : canVoid ? (
          <VoidScoreRecordForm scoreRecordId={record.id} />
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

function extractEvidenceImages(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as {
      adjustment?: {
        evidenceImages?: Array<{
          url?: unknown;
          filename?: unknown;
        }>;
      };
      application?: {
        evidenceJson?: unknown;
      };
      evidence?: {
        images?: Array<{
          url?: unknown;
          filename?: unknown;
        }>;
      };
    };

    const images = [
      ...normalizeEvidenceImages(parsed.adjustment?.evidenceImages, "score-adjustments"),
      ...normalizeEvidenceImages(parsed.evidence?.images, "score-applications"),
      ...normalizeEvidenceImages(
        parseApplicationEvidenceImages(parsed.application?.evidenceJson),
        "score-applications",
      ),
    ];
    const byUrl = new Map(images.map((image) => [image.url, image]));

    return Array.from(byUrl.values());
  } catch {
    return [];
  }
}

function parseApplicationEvidenceImages(value: unknown) {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value) as {
      images?: Array<{
        url?: unknown;
        filename?: unknown;
      }>;
    };

    return parsed.images || [];
  } catch {
    return [];
  }
}

function normalizeEvidenceImages(
  value: Array<{ url?: unknown; filename?: unknown }> | undefined,
  scope: EvidenceUrlScope,
) {
  return (value || [])
    .map((image) => ({
      url: typeof image.url === "string" ? image.url : "",
      filename: typeof image.filename === "string" ? image.filename : "",
    }))
    .filter((image) => isAllowedEvidenceImageUrl(image.url, scope));
}
