"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type {
  BaseScoreGenerateDetail,
  BaseScoreGenerateSummary,
} from "@/lib/services/base-score";

export function BatchGenerateBaseScoreButton({
  tripIds,
}: {
  tripIds: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<BaseScoreGenerateSummary | null>(null);
  const [details, setDetails] = useState<BaseScoreGenerateDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGenerate() {
    if (tripIds.length === 0) {
      setError("当前列表没有可处理的团期");
      return;
    }

    const ok = window.confirm(
      `确认对当前页 ${tripIds.length} 个团期批量生成基础带队积分？已生成或不符合条件的带队记录会自动跳过。`,
    );
    if (!ok) return;

    setError("");
    setSummary(null);
    setDetails([]);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/trips/batch-generate-base-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "selected", tripIds }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        message?: string;
        summary?: BaseScoreGenerateSummary;
        details?: BaseScoreGenerateDetail[];
      } | null;

      if (!response.ok || data?.success === false || !data?.summary) {
        setError(data?.error || data?.message || "批量生成基础积分失败");
        return;
      }

      setSummary(data.summary);
      setDetails(data.details || []);
      router.refresh();
    } catch {
      setError("批量生成请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium">批量生成基础积分</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            对当前页团期生成基础带队积分。不符合条件、已生成的带队记录会跳过。
          </p>
        </div>
        <Button disabled={isSubmitting || tripIds.length === 0} onClick={handleGenerate} type="button">
          {isSubmitting ? "生成中..." : "批量生成当前页"}
        </Button>
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {summary ? (
        <div className="mt-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          已处理 {summary.processedTrips} 个团期，生成 {summary.generatedRecords} 条积分，
          跳过 {summary.skippedTripLeaders} 条带队记录，失败 {summary.failedTrips} 个团期，
          合计 {summary.totalPoints} 分。
        </div>
      ) : null}
      {details.length > 0 ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">查看处理明细</summary>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-md border bg-background">
            {details.slice(0, 80).map((detail, index) => (
              <div className="border-b px-3 py-2 last:border-b-0" key={`${detail.tripId}-${detail.leaderId || index}-${index}`}>
                <span className="font-medium">{detail.routeName}</span>
                {detail.leaderName ? ` · ${detail.leaderName}` : ""}：
                {detail.status === "generated"
                  ? `已生成 ${detail.points} 分`
                  : detail.reason || "已跳过"}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
