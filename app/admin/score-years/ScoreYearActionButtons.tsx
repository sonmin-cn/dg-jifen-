"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ScoreYearStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function ScoreYearActionButtons({
  scoreYearId,
  status,
}: {
  scoreYearId: string;
  status: ScoreYearStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(action: "activate" | "close") {
    setError("");
    const ok = window.confirm(
      action === "activate"
        ? "确认将该积分年度设为 ACTIVE？其他 ACTIVE 年度会被封存。"
        : "确认关闭该积分年度？关闭后不再用于生成新积分。",
    );
    if (!ok) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/score-years/${scoreYearId}/${action}`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setError(data?.error || "操作失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络异常，操作失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-w-[110px] gap-2">
      {status !== "ACTIVE" ? (
        <Button
          disabled={isSubmitting}
          onClick={() => submit("activate")}
          size="sm"
          type="button"
          variant="outline"
        >
          设为 ACTIVE
        </Button>
      ) : (
        <Button
          disabled={isSubmitting}
          onClick={() => submit("close")}
          size="sm"
          type="button"
          variant="outline"
        >
          关闭年度
        </Button>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
