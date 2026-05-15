"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScoreApplicationType } from "@prisma/client";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SCORE_APPLICATION_CONFIGS,
  SCORE_APPLICATION_TYPE_OPTIONS,
} from "@/lib/constants/score-applications";

type TripOption = {
  id: string;
  routeName: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
};

type RulePreview = Record<string, { points: number | null; name: string | null }>;

export function ApplicationCreateForm({
  trips,
  rulePreview,
}: {
  trips: TripOption[];
  rulePreview: RulePreview;
}) {
  const router = useRouter();
  const [type, setType] = useState<ScoreApplicationType | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedConfig = type && type in SCORE_APPLICATION_CONFIGS
    ? SCORE_APPLICATION_CONFIGS[type as keyof typeof SCORE_APPLICATION_CONFIGS]
    : null;
  const pointsText = useMemo(() => {
    if (!type) return "请选择申请类型";
    const points = rulePreview[type]?.points;
    return typeof points === "number" ? `预计 +${formatPoints(points)} 分` : "未找到有效规则";
  }, [rulePreview, type]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const applicationType = String(payload.type || "") as ScoreApplicationType | "";
    const config = applicationType && applicationType in SCORE_APPLICATION_CONFIGS
      ? SCORE_APPLICATION_CONFIGS[applicationType as keyof typeof SCORE_APPLICATION_CONFIGS]
      : null;
    const title = String(payload.title || "").trim();
    const evidenceText = String(payload.evidenceText || "").trim();
    const evidenceUrl = String(payload.evidenceUrl || "").trim();

    if (!applicationType || !config) {
      setError("请选择申请加分类型");
      setIsSubmitting(false);
      return;
    }

    if (config.requireTrip && !String(payload.tripId || "")) {
      setError("当前申请类型需要选择关联团期");
      setIsSubmitting(false);
      return;
    }

    if (!title) {
      setError("请填写申请标题");
      setIsSubmitting(false);
      return;
    }

    if (!evidenceText && !evidenceUrl) {
      setError("请填写证明材料或证明链接");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/leader/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(data?.message || "提交申请失败");
        return;
      }

      router.push("/leader/applications");
      router.refresh();
    } catch {
      setError("提交申请请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 rounded-lg border bg-card p-4 shadow-sm md:p-5" onSubmit={handleSubmit}>
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">申请加分类型</Label>
          <select
            className="h-11 w-full rounded-md border bg-background px-3 text-base md:text-sm"
            id="type"
            name="type"
            onChange={(event) => setType(event.target.value as ScoreApplicationType)}
            value={type}
          >
            <option value="">请选择申请类型</option>
            {SCORE_APPLICATION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_APPLICATION_CONFIGS[option].label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-md border bg-muted/30 px-3 py-3 text-sm">
          <p className="font-medium">{pointsText}</p>
          <p className="mt-1 text-muted-foreground">
            {selectedConfig?.evidenceLabel || "选择类型后显示证明材料要求"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tripId">关联团期</Label>
          <select
            className="h-11 w-full rounded-md border bg-background px-3 text-base md:text-sm"
            id="tripId"
            name="tripId"
          >
            <option value="">不关联或待选择</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.routeName}（{formatDate(trip.endDate)}）
              </option>
            ))}
          </select>
          {selectedConfig?.requireTrip ? (
            <p className="text-xs text-muted-foreground">当前申请类型需要选择关联团期。</p>
          ) : null}
        </div>
        <Field label="申请标题" name="title" />
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">申请说明</Label>
          <Textarea className="min-h-28 text-base md:text-sm" id="description" name="description" placeholder="补充发布内容、复购来源或其他背景" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="evidenceText">证明材料</Label>
          <Textarea className="min-h-32 text-base md:text-sm" id="evidenceText" name="evidenceText" placeholder="填写截图说明、订单号、聊天记录说明等" />
        </div>
        <Field label="证明链接" name="evidenceUrl" placeholder="小红书链接、网盘链接或截图链接" />
      </div>
      <Button className="mt-4 h-11 w-full md:w-auto" disabled={isSubmitting} type="submit">
        <Send className="h-4 w-4" />
        {isSubmitting ? "提交中..." : "提交申请"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input className="h-11 text-base md:text-sm" id={name} name={name} placeholder={placeholder} />
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
