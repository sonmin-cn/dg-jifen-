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
    <form className="mt-6 rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">申请加分类型</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="type"
            name="type"
            onChange={(event) => setType(event.target.value as ScoreApplicationType)}
            required
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
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <p className="font-medium">{pointsText}</p>
          <p className="mt-1 text-muted-foreground">
            {selectedConfig?.evidenceLabel || "选择类型后显示证明材料要求"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tripId">关联团期</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="tripId"
            name="tripId"
            required={Boolean(selectedConfig?.requireTrip)}
          >
            <option value="">不关联或待选择</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.routeName}（{formatDate(trip.endDate)}）
              </option>
            ))}
          </select>
        </div>
        <Field label="申请标题" name="title" required />
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">申请说明</Label>
          <Textarea id="description" name="description" placeholder="补充发布内容、复购来源或其他背景" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="evidenceText">证明材料</Label>
          <Textarea id="evidenceText" name="evidenceText" placeholder="填写截图说明、订单号、聊天记录说明等" />
        </div>
        <Field label="证明链接" name="evidenceUrl" placeholder="小红书链接、网盘链接或截图链接" />
      </div>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button className="mt-4" disabled={isSubmitting} type="submit">
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
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} required={required} />
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
