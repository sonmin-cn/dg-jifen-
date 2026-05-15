"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BindRequestButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leader/bind/request", {
        method: "POST",
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message || "提交绑定申请失败");
        return;
      }

      router.refresh();
    } catch {
      setError("提交绑定申请请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Button className="h-11 w-full sm:w-auto" disabled={isSubmitting} onClick={handleClick} type="button">
        <CheckCircle2 className="h-4 w-4" />
        {isSubmitting ? "提交中..." : "确认这是我的队长档案"}
      </Button>
      {error ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
