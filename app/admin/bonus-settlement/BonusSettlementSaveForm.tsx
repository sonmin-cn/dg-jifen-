"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BonusSettlementSaveForm({
  scoreYearId,
  defaultTitle,
}: {
  scoreYearId: string;
  defaultTitle: string;
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
      const response = await fetch("/api/admin/bonus-settlement/save", {
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
        settlementId?: string;
      } | null;

      if (!response.ok || data?.success === false) {
        setError(data?.error || "保存测算结果失败");
        return;
      }

      router.push(data?.settlementId ? `/admin/bonus-settlement/${data.settlementId}` : "/admin/bonus-settlement");
      router.refresh();
    } catch {
      setError("保存测算结果请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold">保存测算结果</h3>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">测算标题</Label>
          <Input defaultValue={defaultTitle} id="title" name="title" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="remark">备注</Label>
          <Textarea id="remark" name="remark" placeholder="可填写测算口径、试运行说明或内部备注" />
        </div>
      </div>
      <Button className="mt-5" disabled={isSubmitting} type="submit">
        {isSubmitting ? "保存中..." : "保存测算结果"}
      </Button>
    </form>
  );
}
