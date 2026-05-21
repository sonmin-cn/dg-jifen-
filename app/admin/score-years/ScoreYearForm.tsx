"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ScoreYearStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SCORE_YEAR_STATUS_LABELS,
  SCORE_YEAR_STATUS_OPTIONS,
  formatScoreYearDate,
} from "@/lib/constants/score-years";

type ScoreYearFormProps = {
  mode: "create" | "edit";
  scoreYear?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: ScoreYearStatus;
    remark: string | null;
    scoreRecordCount?: number;
  };
};

export function ScoreYearForm({ mode, scoreYear }: ScoreYearFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");
    setIsSubmitting(true);

    const payload = {
      name: String(formData.get("name") || ""),
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || ""),
      status: String(formData.get("status") || ""),
      remark: String(formData.get("remark") || ""),
    };

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/admin/score-years"
          : `/api/admin/score-years/${scoreYear?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error || "保存积分年度失败");
        return;
      }

      router.push("/admin/score-years");
      router.refresh();
    } catch {
      setError("网络异常，保存失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-5 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        如果生成积分时提示未找到积分年度，请新增一个覆盖该团期结束日期的 ACTIVE 积分年度。
        {mode === "edit" && scoreYear?.scoreRecordCount ? (
          <span className="mt-1 block text-amber-700">
            当前年度已有 {scoreYear.scoreRecordCount} 条积分记录，调整日期范围前请确认不会影响历史归属。
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="年度名称">
          <Input
            defaultValue={scoreYear?.name || ""}
            name="name"
            placeholder="2026积分年度"
            required
          />
        </Field>
        <Field label="状态">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={scoreYear?.status || "ACTIVE"}
            name="status"
          >
            {SCORE_YEAR_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {SCORE_YEAR_STATUS_LABELS[status]}（{status}）
              </option>
            ))}
          </select>
        </Field>
        <Field label="开始日期">
          <Input
            defaultValue={scoreYear ? formatScoreYearDate(scoreYear.startDate) : ""}
            name="startDate"
            required
            type="date"
          />
        </Field>
        <Field label="结束日期">
          <Input
            defaultValue={scoreYear ? formatScoreYearDate(scoreYear.endDate) : ""}
            name="endDate"
            required
            type="date"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="说明">
            <Textarea
              defaultValue={scoreYear?.remark || ""}
              name="remark"
              placeholder="可填写年会后到下一次年会前等运营口径说明"
              rows={3}
            />
          </Field>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "保存中..." : "保存积分年度"}
        </Button>
        <Button
          onClick={() => router.push("/admin/score-years")}
          type="button"
          variant="outline"
        >
          取消
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
