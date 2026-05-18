"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/app/admin/components/SearchableSelect";

type Option = SearchableSelectOption;
type RuleOption = {
  id: string;
  code: string;
  name: string;
  points: number;
  category: string;
  description: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
};

type ScoreAdjustmentCreateFormProps = {
  leaders: Option[];
  scoreYears: Option[];
  trips: Option[];
  rules: RuleOption[];
  defaultScoreYearId: string;
};

export function ScoreAdjustmentCreateForm({
  leaders,
  scoreYears,
  trips,
  rules,
  defaultScoreYearId,
}: ScoreAdjustmentCreateFormProps) {
  const router = useRouter();
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id || "");
  const [points, setPoints] = useState(String(rules[0]?.points ?? ""));
  const [item, setItem] = useState(rules[0]?.name || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedRule = useMemo(
    () => rules.find((rule) => rule.id === selectedRuleId) || null,
    [rules, selectedRuleId],
  );
  const isOverriding = selectedRule ? Number(points) !== selectedRule.points : false;

  function handleRuleChange(value: string) {
    const rule = rules.find((entry) => entry.id === value);
    setSelectedRuleId(value);
    if (rule) {
      setPoints(String(rule.points));
      setItem(rule.name);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");

    if (!confirm("确认后将直接生成有效积分记录，并影响队长积分和奖金测算。")) {
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(form);
    const payload = {
      leaderId: String(formData.get("leaderId") || ""),
      scoreYearId: String(formData.get("scoreYearId") || ""),
      ruleId: selectedRuleId,
      tripId: String(formData.get("tripId") || ""),
      occurredAt: String(formData.get("occurredAt") || ""),
      item,
      reason: String(formData.get("reason") || ""),
      evidenceText: String(formData.get("evidenceText") || ""),
      evidenceUrl: String(formData.get("evidenceUrl") || ""),
      points: Number(points),
      overrideReason: String(formData.get("overrideReason") || ""),
      remark: String(formData.get("remark") || ""),
    };

    try {
      const response = await fetch("/api/admin/score-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error || "创建专项加分失败");
        return;
      }

      router.push(
        data.scoreRecordId
          ? `/admin/score-records/${data.scoreRecordId}`
          : "/admin/score-adjustments",
      );
      router.refresh();
    } catch {
      setError("网络异常，创建失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border bg-card p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="队长">
          <SearchableSelect
            emptyText="未找到匹配队长"
            name="leaderId"
            options={leaders}
            placeholder="搜索姓名 / 昵称 / 手机号 / 队长ID"
            required
          />
        </Field>
        <Field label="积分年度">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={defaultScoreYearId} name="scoreYearId">
            {scoreYears.map((scoreYear) => (
              <option key={scoreYear.id} value={scoreYear.id}>
                {scoreYear.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="积分规则">
          <SearchableSelect
            emptyText="暂无匹配的启用加分规则"
            name="ruleId"
            onChange={handleRuleChange}
            options={rules.map((rule) => ({
              id: rule.id,
              label: `${rule.name} / ${rule.code} / +${formatPoints(rule.points)} / ${rule.category}`,
              description: rule.description,
              searchText: `${rule.name} ${rule.code} ${rule.category}`,
            }))}
            placeholder="搜索规则名称 / code / 分类"
            required
            value={selectedRuleId}
          />
        </Field>
        <Field label="关联团期（选填）">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" name="tripId">
            <option value="">未关联团期</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="发生时间">
          <Input defaultValue={toDateTimeLocal(new Date())} name="occurredAt" type="datetime-local" />
        </Field>
        <Field label="加分标题">
          <Input onChange={(event) => setItem(event.target.value)} value={item} />
        </Field>
        <Field label="加分分值">
          <Input onChange={(event) => setPoints(event.target.value)} step="0.5" type="number" value={points} />
        </Field>
        <div className="md:col-span-2">
          {selectedRule ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{selectedRule.name}</p>
              <p className="mt-1 text-muted-foreground">
                默认 +{formatPoints(selectedRule.points)} · 分类 {selectedRule.category} · 生效 {formatDate(selectedRule.effectiveFrom)}
                {selectedRule.effectiveTo ? ` 至 ${formatDate(selectedRule.effectiveTo)}` : ""}
              </p>
              {selectedRule.description ? (
                <p className="mt-1 text-muted-foreground">{selectedRule.description}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        {isOverriding ? (
          <div className="md:col-span-2">
            <Field label="覆盖原因">
              <Textarea name="overrideReason" placeholder="你正在覆盖规则默认分值，请填写覆盖原因。" rows={3} />
            </Field>
          </div>
        ) : null}
        <div className="md:col-span-2">
          <Field label="加分原因">
            <Textarea name="reason" rows={3} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="证据说明">
            <Textarea name="evidenceText" rows={3} />
          </Field>
        </div>
        <Field label="证据链接（选填）">
          <Input name="evidenceUrl" />
        </Field>
        <Field label="备注（选填）">
          <Input name="remark" />
        </Field>
      </div>

      {error ? <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-4">
        <Button disabled={isSubmitting || rules.length === 0} type="submit">
          {isSubmitting ? "提交中..." : "创建专项加分"}
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

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
}

function toDateTimeLocal(value: Date) {
  const offset = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
