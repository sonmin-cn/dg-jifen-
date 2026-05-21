"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type {
  BaseScoreGenerateDetail,
  BaseScoreGenerateSummary,
} from "@/lib/services/base-score";

type TripSelectionContextValue = {
  tripIds: string[];
  selectedTripIds: string[];
  toggleTrip: (tripId: string, checked: boolean) => void;
  toggleAll: (checked: boolean) => void;
};

const TripSelectionContext = createContext<TripSelectionContextValue | null>(null);

export function TripSelectionProvider({
  tripIds,
  children,
}: {
  tripIds: string[];
  children: ReactNode;
}) {
  const uniqueTripIds = useMemo(() => [...new Set(tripIds)], [tripIds]);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  function toggleTrip(tripId: string, checked: boolean) {
    setSelectedTripIds((current) =>
      checked
        ? [...new Set([...current, tripId])]
        : current.filter((id) => id !== tripId),
    );
  }

  function toggleAll(checked: boolean) {
    setSelectedTripIds(checked ? uniqueTripIds : []);
  }

  return (
    <TripSelectionContext.Provider
      value={{ tripIds: uniqueTripIds, selectedTripIds, toggleTrip, toggleAll }}
    >
      {children}
    </TripSelectionContext.Provider>
  );
}

export function TripSelectionCheckbox({ tripId }: { tripId: string }) {
  const context = useTripSelection();

  return (
    <input
      aria-label="选择团期"
      checked={context.selectedTripIds.includes(tripId)}
      className="h-4 w-4 rounded border"
      onChange={(event) => context.toggleTrip(tripId, event.target.checked)}
      type="checkbox"
    />
  );
}

export function TripSelectAllCheckbox() {
  const context = useTripSelection();
  const checked =
    context.tripIds.length > 0 &&
    context.selectedTripIds.length === context.tripIds.length;
  const indeterminate =
    context.selectedTripIds.length > 0 &&
    context.selectedTripIds.length < context.tripIds.length;

  return (
    <input
      aria-label="选择当前页全部团期"
      checked={checked}
      className="h-4 w-4 rounded border"
      ref={(element) => {
        if (element) element.indeterminate = indeterminate;
      }}
      onChange={(event) => context.toggleAll(event.target.checked)}
      type="checkbox"
    />
  );
}

export function BatchGenerateBaseScoreButton() {
  const { selectedTripIds } = useTripSelection();
  const router = useRouter();
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<BaseScoreGenerateSummary | null>(null);
  const [details, setDetails] = useState<BaseScoreGenerateDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGenerate() {
    if (selectedTripIds.length === 0) {
      setError("请先选择需要生成积分的团期");
      return;
    }

    const ok = window.confirm(
      `确认对已选择的 ${selectedTripIds.length} 个团期批量生成基础带队积分？已生成、离职、暂停或不符合条件的带队记录会自动跳过。`,
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
        body: JSON.stringify({ scope: "selected", tripIds: selectedTripIds }),
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
            仅为已完成团期中，已完成带队、实际带队天数大于 0、且队长状态为实习/正式的记录生成基础积分；已生成、离职、暂停或不符合条件的记录会自动跳过。
          </p>
          {selectedTripIds.length === 0 ? (
            <p className="mt-2 text-sm text-amber-600">请先选择需要生成积分的团期。</p>
          ) : null}
        </div>
        <Button disabled={isSubmitting || selectedTripIds.length === 0} onClick={handleGenerate} type="button">
          {isSubmitting ? "生成中..." : `批量生成已选${selectedTripIds.length ? `（${selectedTripIds.length}）` : ""}`}
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
            {details.slice(0, 120).map((detail, index) => (
              <div className="border-b px-3 py-2 last:border-b-0" key={`${detail.tripId}-${detail.leaderId || index}-${index}`}>
                <span className="font-medium">{detail.routeName}</span>
                {detail.leaderName ? ` · ${detail.leaderName}` : ""}：
                {detail.status === "generated"
                  ? `已生成 ${detail.points} 分`
                  : detail.reason || "已跳过"}
                {detail.reason?.includes("/admin/score-years") ? (
                  <Link className="ml-2 underline" href="/admin/score-years">
                    前往积分年度管理
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function useTripSelection() {
  const context = useContext(TripSelectionContext);
  if (!context) {
    throw new Error("Trip selection components must be used inside TripSelectionProvider");
  }

  return context;
}
