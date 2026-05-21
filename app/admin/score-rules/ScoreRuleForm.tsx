"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  ScoreCategory,
  ScoreDirection,
  ScoreRuleReviewType,
  ScoreRuleTriggerType,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SCORE_CATEGORY_LABELS, SCORE_DIRECTION_LABELS } from "@/lib/constants/scores";

type ScoreRuleFormProps = {
  mode: "create" | "edit";
  rule?: {
    id: string;
    code: string;
    name: string;
    version: number;
    category: ScoreCategory;
    direction: ScoreDirection;
    points: number;
    reviewType: ScoreRuleReviewType;
    triggerType: ScoreRuleTriggerType;
    isActive: boolean;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    description: string | null;
    configJson: string | null;
  };
};

const categoryOptions = Object.keys(SCORE_CATEGORY_LABELS) as ScoreCategory[];
const directionOptions = Object.keys(SCORE_DIRECTION_LABELS) as ScoreDirection[];
const reviewTypeOptions: ScoreRuleReviewType[] = ["AUTO", "MANUAL_REVIEW", "MANUAL_RECORD"];
const triggerTypeOptions: ScoreRuleTriggerType[] = [
  "TRIP_COMPLETED",
  "SCORE_APPLICATION_APPROVED",
  "HOLIDAY_ATTENDANCE_APPROVED",
  "VIOLATION_CONFIRMED",
  "MANUAL",
];
const reviewTypeLabels: Record<ScoreRuleReviewType, string> = {
  AUTO: "自动生效",
  MANUAL_REVIEW: "人工审核",
  MANUAL_RECORD: "后台手动记录",
};
const triggerTypeLabels: Record<ScoreRuleTriggerType, string> = {
  TRIP_COMPLETED: "团期完成后生成",
  SCORE_APPLICATION_APPROVED: "队长申请审核通过",
  HOLIDAY_ATTENDANCE_APPROVED: "节假日出勤审核通过",
  VIOLATION_CONFIRMED: "录入违规后生成",
  MANUAL: "后台手动录入",
};

export function ScoreRuleForm({ mode, rule }: ScoreRuleFormProps) {
  const router = useRouter();
  const initialConfig = parseConfigJson(rule?.configJson);
  const [code, setCode] = useState(rule?.code || "");
  const [category, setCategory] = useState<ScoreCategory>(rule?.category || "MANUAL");
  const [allowLeaderApplication, setAllowLeaderApplication] = useState(
    initialConfig.allowLeaderApplication === true,
  );
  const [requireTrip, setRequireTrip] = useState(initialConfig.requireTrip === true);
  const [perTripPoints, setPerTripPoints] = useState(
    String(initialConfig.perTripPoints ?? 1),
  );
  const [perDayPoints, setPerDayPoints] = useState(
    String(initialConfig.perDayPoints ?? 1),
  );
  const [advancedJson, setAdvancedJson] = useState(
    rule?.configJson ? formatJson(rule.configJson) : "",
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const formData = new FormData(form);
    const configResult = buildConfigJson({
      advancedJson,
      allowLeaderApplication,
      requireTrip,
      isBaseTrip: code.trim().toUpperCase() === "BASE_TRIP" || category === "BASE_TRIP",
      perTripPoints,
      perDayPoints,
    });

    if (!configResult.ok) {
      setError(configResult.message);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      code: code.trim(),
      name: String(formData.get("name") || ""),
      version: Number(formData.get("version") || 1),
      category,
      direction: String(formData.get("direction") || ""),
      points: Number(formData.get("points") || 0),
      reviewType: String(formData.get("reviewType") || ""),
      triggerType: String(formData.get("triggerType") || ""),
      isActive: formData.get("isActive") === "true",
      effectiveFrom: String(formData.get("effectiveFrom") || ""),
      effectiveTo: String(formData.get("effectiveTo") || ""),
      description: String(formData.get("description") || ""),
      configJson: configResult.configJson,
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/admin/score-rules" : `/api/admin/score-rules/${rule?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error || "保存积分规则失败");
        return;
      }

      setSuccess(data.message || "积分规则已保存");
      if (mode === "create") {
        form.reset();
        setCode("");
        setCategory("MANUAL");
        setAllowLeaderApplication(false);
        setRequireTrip(false);
        setPerTripPoints("1");
        setPerDayPoints("1");
        setAdvancedJson("");
      }
      router.refresh();
      if (mode === "edit") {
        router.push("/admin/score-rules");
      }
    } catch {
      setError("网络异常，保存失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border bg-card p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Field
          label="规则编码 code"
          hint="用于系统识别，建议使用英文大写和下划线，例如 MOMENTS_POST。编辑已有规则时请谨慎修改。"
        >
          <Input
            disabled={mode === "edit"}
            name="code"
            onChange={(event) => setCode(event.target.value)}
            placeholder="SPECIAL_CONTRIBUTION"
            value={code}
          />
        </Field>
        <Field label="规则名称">
          <Input defaultValue={rule?.name || ""} name="name" placeholder="特殊贡献加分" />
        </Field>
        <Field label="版本">
          <Input defaultValue={rule?.version ?? 1} min={1} name="version" type="number" />
        </Field>
        <Field label="分类">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            name="category"
            onChange={(event) => setCategory(event.target.value as ScoreCategory)}
            value={category}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {SCORE_CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="方向">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={rule?.direction || "ADD"} name="direction">
            {directionOptions.map((option) => (
              <option key={option} value={option}>
                {SCORE_DIRECTION_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="分值">
          <Input defaultValue={rule?.points ?? 1} name="points" step="0.5" type="number" />
        </Field>
        <Field label="审核方式">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={rule?.reviewType || "MANUAL_REVIEW"} name="reviewType">
            {reviewTypeOptions.map((option) => (
              <option key={option} value={option}>
                {reviewTypeLabels[option]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="触发方式">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={rule?.triggerType || "MANUAL"} name="triggerType">
            {triggerTypeOptions.map((option) => (
              <option key={option} value={option}>
                {triggerTypeLabels[option]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="是否启用">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={String(rule?.isActive ?? true)} name="isActive">
            <option value="true">启用</option>
            <option value="false">停用</option>
          </select>
        </Field>
        <Field label="生效时间">
          <Input defaultValue={toDateTimeLocal(rule?.effectiveFrom) || toDateTimeLocal(new Date())} name="effectiveFrom" type="datetime-local" />
        </Field>
        <Field label="失效时间">
          <Input defaultValue={toDateTimeLocal(rule?.effectiveTo)} name="effectiveTo" type="datetime-local" />
        </Field>
        <div className="md:col-span-3">
          <Field label="规则说明">
            <Textarea defaultValue={rule?.description || ""} name="description" rows={3} />
          </Field>
        </div>
        <div className="md:col-span-3">
          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="font-medium">可视化配置</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              普通规则只需要填写名称、分值、分类、加扣分方向；是否允许队长申请、是否需要关联团期可用开关控制。如非技术人员，不建议手写 JSON。
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={allowLeaderApplication}
                  onChange={(event) => setAllowLeaderApplication(event.target.checked)}
                  type="checkbox"
                />
                允许队长端申请
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={requireTrip}
                  onChange={(event) => setRequireTrip(event.target.checked)}
                  type="checkbox"
                />
                申请时必须关联团期
              </label>
            </div>
            {code.trim().toUpperCase() === "BASE_TRIP" || category === "BASE_TRIP" ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="每团基础分">
                  <Input
                    onChange={(event) => setPerTripPoints(event.target.value)}
                    step="0.5"
                    type="number"
                    value={perTripPoints}
                  />
                </Field>
                <Field label="每天带队分">
                  <Input
                    onChange={(event) => setPerDayPoints(event.target.value)}
                    step="0.5"
                    type="number"
                    value={perDayPoints}
                  />
                </Field>
                <p className="text-sm text-muted-foreground md:col-span-2">
                  公式说明：每团基础分 + 实际带队天数 × 每天带队分。
                </p>
              </div>
            ) : null}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">高级 JSON 配置</summary>
              <Textarea
                className="mt-3 font-mono text-xs"
                onChange={(event) => setAdvancedJson(event.target.value)}
                placeholder='{"yearlyCap": 30}'
                rows={5}
                value={advancedJson}
              />
            </details>
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="mt-3 rounded-md border bg-muted px-3 py-2 text-sm">{success}</p> : null}
      <div className="mt-4 flex gap-2">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "保存中..." : mode === "create" ? "新增规则" : "保存规则"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function toDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function parseConfigJson(value: string | null | undefined) {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function buildConfigJson({
  advancedJson,
  allowLeaderApplication,
  requireTrip,
  isBaseTrip,
  perTripPoints,
  perDayPoints,
}: {
  advancedJson: string;
  allowLeaderApplication: boolean;
  requireTrip: boolean;
  isBaseTrip: boolean;
  perTripPoints: string;
  perDayPoints: string;
}):
  | { ok: true; configJson: string }
  | { ok: false; message: string } {
  let config: Record<string, unknown> = {};
  if (advancedJson.trim()) {
    try {
      config = JSON.parse(advancedJson) as Record<string, unknown>;
    } catch {
      return { ok: false, message: "高级 JSON 配置格式不正确" };
    }
  }

  config.allowLeaderApplication = allowLeaderApplication;
  config.requireTrip = requireTrip;

  if (isBaseTrip) {
    const normalizedPerTripPoints = Number(perTripPoints);
    const normalizedPerDayPoints = Number(perDayPoints);
    if (!Number.isFinite(normalizedPerTripPoints) || !Number.isFinite(normalizedPerDayPoints)) {
      return { ok: false, message: "基础积分配置必须是数字" };
    }
    config.formula = "perTripPoints + actualWorkDays * perDayPoints";
    config.perTripPoints = normalizedPerTripPoints;
    config.perDayPoints = normalizedPerDayPoints;
  }

  return { ok: true, configJson: JSON.stringify(config) };
}
