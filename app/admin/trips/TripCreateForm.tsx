"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TRIP_STATUS_LABELS,
  TRIP_STATUS_OPTIONS,
} from "@/lib/constants/trips";

export function TripCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        message?: string;
        trip?: { id: string };
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setError(
          data.errors
            ? Object.values(data.errors).join("；")
            : data.message || "新增失败",
        );
        return;
      }

      form.reset();
      router.refresh();
      if (data.trip?.id) {
        router.push(`/admin/trips/${data.trip.id}`);
      }
    } catch {
      setError("新增请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">新增团期</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          只维护团期基础信息，基础积分生成将在下一任务接入。
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="路线名称" name="routeName" required />
        <Field label="区域" name="region" />
        <Field label="出发日期" name="startDate" required type="date" />
        <Field label="结束日期" name="endDate" required type="date" />
        <Field label="行程天数" name="tripDays" required step="0.5" type="number" />
        <Field label="出团人数" name="participantCount" type="number" />
        <Field label="产品经理ID" name="productManagerId" />
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            defaultValue="PLANNED"
            id="status"
            name="status"
          >
            {TRIP_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {TRIP_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="isHoliday" type="checkbox" />
          节假日团期
        </label>
      </div>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button className="mt-4" disabled={isSubmitting} type="submit">
        <Plus className="h-4 w-4" />
        {isSubmitting ? "保存中..." : "新增团期"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  step,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  step?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} step={step} type={type} />
    </div>
  );
}
