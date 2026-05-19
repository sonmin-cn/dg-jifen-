"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteLeaderButton({
  leaderId,
  disabledReason,
}: {
  leaderId: string;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (disabledReason) return;
    const ok = window.confirm("确认删除该队长档案？该操作仅适用于无任何业务记录的错误档案。");
    if (!ok) return;

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/leaders/${leaderId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setError(data?.message || "删除失败");
        return;
      }

      router.push("/admin/leaders");
      router.refresh();
    } catch {
      setError("删除请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-5 rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">安全删除</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        仅无绑定账号、无带队、无积分、无申请、无违规和无奖金测算记录的错误档案可删除。
      </p>
      {disabledReason ? (
        <p className="mt-3 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        className="mt-4"
        disabled={Boolean(disabledReason) || isSubmitting}
        onClick={handleDelete}
        type="button"
        variant="outline"
      >
        <Trash2 className="h-4 w-4" />
        {isSubmitting ? "删除中..." : "删除队长档案"}
      </Button>
    </section>
  );
}
