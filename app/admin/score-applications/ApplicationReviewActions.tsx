"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ApplicationReviewActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [reviewRemark, setReviewRemark] = useState("");
  const [approvedPoints, setApprovedPoints] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(action: "approve" | "reject") {
    setError("");
    if (action === "reject" && !rejectReason.trim()) {
      setError("拒绝时必须填写原因");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/score-applications/${applicationId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body:
            action === "approve"
              ? JSON.stringify({
                  reviewRemark,
                  approvedPoints: approvedPoints ? Number(approvedPoints) : undefined,
                })
              : JSON.stringify({ rejectReason }),
        },
      );
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(data?.message || "审核操作失败");
        return;
      }

      router.refresh();
    } catch {
      setError("审核请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        onChange={(event) => setReviewRemark(event.target.value)}
        placeholder="通过备注，可选"
        value={reviewRemark}
      />
      <Input
        min="0"
        onChange={(event) => setApprovedPoints(event.target.value)}
        placeholder="批准分值，可选；抖音/视频号可按截图小红心填写"
        step="0.5"
        type="number"
        value={approvedPoints}
      />
      <div className="flex gap-2">
        <Button
          disabled={isSubmitting}
          onClick={() => submit("approve")}
          size="sm"
          type="button"
        >
          通过
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={() => submit("reject")}
          size="sm"
          type="button"
          variant="outline"
        >
          拒绝
        </Button>
      </div>
      <Input
        onChange={(event) => setRejectReason(event.target.value)}
        placeholder="拒绝原因"
        value={rejectReason}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
