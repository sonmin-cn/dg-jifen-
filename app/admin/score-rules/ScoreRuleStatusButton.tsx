"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ScoreRuleStatusButton({
  ruleId,
  isActive,
}: {
  ruleId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/score-rules/${ruleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error || "更新规则状态失败");
        return;
      }

      router.refresh();
    } catch {
      setError("网络异常，更新失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button disabled={isSubmitting} onClick={handleClick} size="sm" type="button" variant="outline">
        {isSubmitting ? "处理中..." : isActive ? "停用" : "启用"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
