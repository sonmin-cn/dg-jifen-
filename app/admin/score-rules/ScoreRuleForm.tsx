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

export function ScoreRuleForm({ mode, rule }: ScoreRuleFormProps) {
  const router = useRouter();
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
    const payload = {
      code: String(formData.get("code") || ""),
      name: String(formData.get("name") || ""),
      version: Number(formData.get("version") || 1),
      category: String(formData.get("category") || ""),
      direction: String(formData.get("direction") || ""),
      points: Number(formData.get("points") || 0),
      reviewType: String(formData.get("reviewType") || ""),
      triggerType: String(formData.get("triggerType") || ""),
      isActive: formData.get("isActive") === "true",
      effectiveFrom: String(formData.get("effectiveFrom") || ""),
      effectiveTo: String(formData.get("effectiveTo") || ""),
      description: String(formData.get("description") || ""),
      configJson: String(formData.get("configJson") || ""),
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
        <Field label="规则 code">
          <Input defaultValue={rule?.code || ""} name="code" placeholder="SPECIAL_CONTRIBUTION" />
        </Field>
        <Field label="规则名称">
          <Input defaultValue={rule?.name || ""} name="name" placeholder="特殊贡献加分" />
        </Field>
        <Field label="版本">
          <Input defaultValue={rule?.version ?? 1} min={1} name="version" type="number" />
        </Field>
        <Field label="分类">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={rule?.category || "MANUAL"} name="category">
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
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="触发方式">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={rule?.triggerType || "MANUAL"} name="triggerType">
            {triggerTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
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
          <Field label="configJson">
            <Textarea defaultValue={rule?.configJson || ""} name="configJson" placeholder='{"yearlyCap": 30}' rows={4} />
          </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      <span>{label}</span>
      {children}
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
