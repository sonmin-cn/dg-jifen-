"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function VoidScoreRecordForm({ scoreRecordId }: { scoreRecordId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const voidReason = String(new FormData(form).get("voidReason") || "").trim();

    if (!voidReason) {
      setError("请填写作废原因");
      return;
    }

    const confirmed = window.confirm(
      "作废后，该积分不再计入队长年度积分，但记录仍会保留在积分台账中。请确认是否作废。",
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/score-records/${scoreRecordId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voidReason }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || data?.success === false) {
        setError(data?.error || "作废积分失败");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError("作废积分请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border border-destructive/30 bg-card p-5 text-sm shadow-sm" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-destructive">作废积分</h3>
      <p className="mt-2 text-muted-foreground">
        作废后，该积分不再计入队长年度积分，但记录仍会保留在积分台账中。
      </p>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 space-y-2">
        <Label htmlFor="voidReason">作废原因</Label>
        <Textarea
          className="min-h-24"
          id="voidReason"
          name="voidReason"
          placeholder="请填写作废原因"
        />
      </div>
      <Button className="mt-4" disabled={isSubmitting} type="submit" variant="destructive">
        {isSubmitting ? "作废中..." : "作废积分"}
      </Button>
    </form>
  );
}
