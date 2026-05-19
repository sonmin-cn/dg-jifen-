"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    const ok = window.confirm("确认删除该团期？仅无带队、无积分、无申请、无违规记录的错误团期可删除。");
    if (!ok) return;

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setError(data?.message || "删除失败");
        return;
      }

      router.push("/admin/trips");
      router.refresh();
    } catch {
      setError("删除请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-5 rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">删除团期</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        仅无带队、无积分、无申请、无违规记录的错误团期可删除；已有业务记录的团期请改为取消。
      </p>
      {error ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        className="mt-4"
        disabled={isSubmitting}
        onClick={handleDelete}
        type="button"
        variant="outline"
      >
        <Trash2 className="h-4 w-4" />
        {isSubmitting ? "删除中..." : "删除团期"}
      </Button>
    </section>
  );
}
