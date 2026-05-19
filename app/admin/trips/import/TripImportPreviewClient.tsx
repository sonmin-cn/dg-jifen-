"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  TripImportConfirmDetail,
  TripImportConfirmSummary,
  TripImportPreviewRow,
} from "@/lib/services/trip-import";

type PreviewResponse = {
  sheetName: string;
  totalRows: number;
  rows: TripImportPreviewRow[];
};

type ConfirmResult = {
  summary: TripImportConfirmSummary;
  details: TripImportConfirmDetail[];
};

export function TripImportPreviewClient() {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPreview(null);
    setConfirmResult(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/trips/import/preview", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        message?: string;
        preview?: PreviewResponse;
      };

      if (!response.ok || !data.preview) {
        setError(data.message || "解析失败");
        return;
      }

      setPreview(data.preview);
    } catch {
      setError("上传解析失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview) return;
    setError("");
    setConfirmResult(null);
    setIsConfirming(true);

    try {
      const response = await fetch("/api/trips/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.rows }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        summary?: TripImportConfirmSummary;
        details?: TripImportConfirmDetail[];
      } | null;

      if (!response.ok || data?.success === false || !data?.summary) {
        setError(data?.error || "确认导入失败");
        return;
      }

      setConfirmResult({
        summary: data.summary,
        details: data.details || [],
      });
    } catch {
      setError("确认导入请求失败，请稍后重试");
    } finally {
      setIsConfirming(false);
    }
  }

  const importableCount = preview?.rows.filter((row) => row.status === "可导入").length || 0;

  return (
    <div>
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/trips">返回团期列表</Link>
      </Button>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">导入销转表预览</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          上传销转表后先预览解析结果，确认后会正式写入团期和带队记录。
        </p>
      </div>

      <form
        className="mb-6 rounded-lg border bg-card p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="file">销转表 .xlsx 文件</Label>
            <Input
              accept=".xlsx"
              id="file"
              name="file"
              required
              type="file"
            />
          </div>
          <Button disabled={isSubmitting} type="submit">
            <Upload className="h-4 w-4" />
            {isSubmitting ? "解析中..." : "上传并预览"}
          </Button>
        </div>
        {error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>

      {preview ? (
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">预览结果</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                工作表：{preview.sheetName}，共 {preview.totalRows} 行
              </p>
            </div>
            <Button
              disabled={importableCount === 0 || isConfirming}
              onClick={handleConfirmImport}
              type="button"
              variant="outline"
            >
              {isConfirming ? "导入中..." : `确认导入${importableCount ? `（${importableCount} 行）` : ""}`}
            </Button>
          </div>
          {confirmResult ? (
            <ImportResultPanel result={confirmResult} />
          ) : null}
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-[1500px] border-collapse text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  {[
                    "行号",
                    "状态",
                    "套餐编号",
                    "路线类型",
                    "路线名称",
                    "套餐名称",
                    "开始时间",
                    "结束时间",
                    "城市",
                    "套餐状态",
                    "目前旅客数",
                    "最大成行人数",
                    "路线负责人",
                    "队长安排原文",
                    "主队",
                    "副队",
                    "跟队",
                  ].map((header) => (
                    <th className="whitespace-nowrap px-3 py-2 font-medium" key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.length > 0 ? (
                  preview.rows.map((row) => (
                    <tr className="border-t align-top" key={row.rowNumber}>
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2">
                        <ImportStatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2">{row.packageNo || "-"}</td>
                      <td className="px-3 py-2">{row.routeType || "-"}</td>
                      <td className="px-3 py-2">{row.routeName || "-"}</td>
                      <td className="px-3 py-2">{row.packageName || "-"}</td>
                      <td className="px-3 py-2">{row.startTime || "-"}</td>
                      <td className="px-3 py-2">{row.endTime || "-"}</td>
                      <td className="px-3 py-2">{row.city || "-"}</td>
                      <td className="px-3 py-2">{row.packageStatus || "-"}</td>
                      <td className="px-3 py-2">{row.travelerCount || "-"}</td>
                      <td className="px-3 py-2">{row.maxTravelerCount || "-"}</td>
                      <td className="px-3 py-2">{row.routeOwner || "-"}</td>
                      <td className="max-w-sm whitespace-pre-wrap px-3 py-2">
                        {row.leaderAssignmentRaw || "-"}
                      </td>
                      <td className="px-3 py-2">{row.mainLeaders.join("、") || "-"}</td>
                      <td className="px-3 py-2">
                        {row.assistantLeaders.join("、") || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {row.followerLeaders.join("、") || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={17}>
                      没有可预览的数据行。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ImportResultPanel({ result }: { result: ConfirmResult }) {
  const summaryItems = [
    ["创建团期", result.summary.createdTrips],
    ["更新团期", result.summary.updatedTrips],
    ["创建带队记录", result.summary.createdTripLeaders],
    ["更新带队记录", result.summary.updatedTripLeaders],
    ["跳过带队记录", result.summary.skippedTripLeaders],
    ["无法匹配队长", result.summary.unmatchedLeaders],
    ["失败行", result.summary.failedRows],
  ];

  return (
    <div className="mb-5 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-semibold">导入完成</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            以下统计基于本次确认导入结果。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/trips">返回团期列表</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()} type="button">
            继续导入
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map(([label, value]) => (
          <div className="rounded-md border bg-background p-3" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {result.details.length > 0 ? (
        <div className="mt-4 max-h-72 overflow-auto rounded-md border bg-background">
          <table className="min-w-[900px] w-full border-collapse text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">行号</th>
                <th className="px-3 py-2 font-medium">路线</th>
                <th className="px-3 py-2 font-medium">队长</th>
                <th className="px-3 py-2 font-medium">动作</th>
                <th className="px-3 py-2 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {result.details.slice(0, 200).map((detail, index) => (
                <tr className="border-t" key={`${detail.rowIndex}-${detail.action}-${index}`}>
                  <td className="px-3 py-2">{detail.rowIndex}</td>
                  <td className="px-3 py-2">{detail.routeName || "-"}</td>
                  <td className="px-3 py-2">{detail.leaderName || "-"}</td>
                  <td className="px-3 py-2">{detail.action}</td>
                  <td className="px-3 py-2">{detail.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function ImportStatusBadge({
  status,
}: {
  status: TripImportPreviewRow["status"];
}) {
  return (
    <Badge variant={status === "可导入" ? "secondary" : "outline"}>
      {status}
    </Badge>
  );
}
