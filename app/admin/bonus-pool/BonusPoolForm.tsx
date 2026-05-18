"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BonusPoolForm({
  scoreYearId,
}: {
  scoreYearId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/bonus-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          scoreYearId,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || data?.success === false) {
        setError(data?.error || "奖金池注入失败");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError("奖金池注入请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold">新增奖金池注入</h3>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="标题" name="title" placeholder="例如：2026年5月奖金池注入" />
        <Field label="金额" name="amount" placeholder="10000" type="number" />
        <Field label="来源类型" name="sourceType" placeholder="MANUAL / MONTHLY_PROFIT" />
        <Field defaultValue={formatDateTimeInput(new Date())} label="注入时间" name="injectedAt" type="datetime-local" />
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">说明</Label>
          <Textarea id="description" name="description" placeholder="可填写奖金池来源、月份或备注" />
        </div>
      </div>
      <Button className="mt-5" disabled={isSubmitting} type="submit">
        {isSubmitting ? "提交中..." : "新增注入"}
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

function formatDateTimeInput(value: Date) {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
