"use client";

import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/app/admin/components/SearchableSelect";
import {
  VIOLATION_CONFIGS,
  VIOLATION_RULE_OPTIONS,
  type ViolationRuleCode,
} from "@/lib/constants/violations";

type LeaderOption = SearchableSelectOption;

type TripOption = {
  id: string;
  routeName: string;
  startDate: Date | string;
  endDate: Date | string;
};

type RulePreview = Record<string, { points: number | null; name: string; category: string }>;

export function ViolationCreateForm({
  leaders,
  trips,
  rulePreview,
}: {
  leaders: LeaderOption[];
  trips: TripOption[];
  rulePreview: RulePreview;
}) {
  const router = useRouter();
  const [ruleCode, setRuleCode] = useState<ViolationRuleCode | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedConfig = ruleCode ? VIOLATION_CONFIGS[ruleCode] : null;
  const selectedRule = ruleCode ? rulePreview[ruleCode] : null;
  const pointsText = useMemo(() => {
    if (!ruleCode) return "请选择扣分类型";
    return typeof selectedRule?.points === "number"
      ? `预计 ${formatPoints(selectedRule.points)} 分`
      : "未找到有效规则";
  }, [ruleCode, selectedRule?.points]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const currentRuleCode = String(payload.ruleCode || "") as ViolationRuleCode | "";
    const config = currentRuleCode ? VIOLATION_CONFIGS[currentRuleCode] : null;
    const tripId = String(payload.tripId || "").trim();

    if (!String(payload.leaderId || "")) {
      setError("请选择队长");
      return;
    }

    if (!currentRuleCode || !config) {
      setError("请选择扣分类型");
      return;
    }

    if (config.requiresTrip && !tripId) {
      setError(`${config.label}必须选择关联团期`);
      return;
    }

    const confirmed = window.confirm("确认后将立即生成扣分记录，并影响队长积分。");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          tripId: tripId || null,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        violationEventId?: string;
      } | null;

      if (!response.ok || data?.success === false) {
        setError(data?.error || "创建扣分事件失败");
        return;
      }

      router.push(data?.violationEventId ? `/admin/violations/${data.violationEventId}` : "/admin/violations");
      router.refresh();
    } catch {
      setError("创建扣分事件请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="leaderId">队长</Label>
          <SearchableSelect
            emptyText="未找到匹配队长"
            name="leaderId"
            options={leaders}
            placeholder="搜索姓名 / 昵称 / 手机号 / 队长ID"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ruleCode">扣分类型</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="ruleCode"
            name="ruleCode"
            onChange={(event) => {
              setRuleCode(event.target.value as ViolationRuleCode);
              setError("");
            }}
            value={ruleCode}
          >
            <option value="">请选择扣分类型</option>
            {VIOLATION_RULE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VIOLATION_CONFIGS[option].label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-md border bg-muted/30 px-3 py-3 text-sm md:col-span-2">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-primary" />
            {pointsText}
          </p>
          <p className="mt-1 text-muted-foreground">
            {selectedConfig?.description || "选择扣分类型后显示规则说明。"}
          </p>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2" htmlFor="tripId">
            关联团期
            {selectedConfig ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {selectedConfig.requiresTrip ? "必填" : "选填"}
              </span>
            ) : null}
          </Label>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" id="tripId" name="tripId">
            <option value="">不关联团期</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.routeName}（{formatDate(trip.endDate)}）
              </option>
            ))}
          </select>
          {selectedConfig?.requiresTrip ? (
            <p className="text-xs text-muted-foreground">该扣分类型需要关联具体团期。</p>
          ) : null}
        </div>
        <Field
          defaultValue={formatDateTimeInput(new Date())}
          label="发生时间"
          name="occurredAt"
          type="datetime-local"
        />
        <Field label="事件标题（选填）" name="title" placeholder="为空时默认使用扣分规则名称" />
        <Field label="证据链接" name="evidenceUrl" placeholder="截图链接、工单链接或网盘链接" />
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">事件说明（选填）</Label>
          <Textarea className="min-h-28" id="description" name="description" placeholder="建议填写说明和证据，便于后续复核。" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="evidenceText">证据说明（选填）</Label>
          <Textarea className="min-h-28" id="evidenceText" name="evidenceText" placeholder="建议填写投诉记录、聊天记录、现场照片或主管核实结论，便于后续复核。" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="remark">处理备注</Label>
          <Textarea className="min-h-24" id="remark" name="remark" placeholder="可填写内部处理说明，选填" />
        </div>
      </div>
      <Button className="mt-5" disabled={isSubmitting} type="submit">
        {isSubmitting ? "提交中..." : "确认扣分"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={defaultValue} id={name} name={name} placeholder={placeholder} type={type} />
    </div>
  );
}

function formatDate(value: Date | string) {
  return formatDateCN(value);
}

function formatDateTimeInput(value: Date) {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatPoints(value: number) {
  if (value === 0) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
