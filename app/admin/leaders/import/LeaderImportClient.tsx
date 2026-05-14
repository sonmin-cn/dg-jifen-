"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PreviewRow = {
  rowNumber: number;
  externalLeaderId: string;
  realName: string;
  nickname: string;
  phone: string;
  residentLocation: string;
  rawLeaderIdentity: string;
  rawLeaderLevel: string;
  leadCount: number | null;
  leadDays: number | null;
  auditTime: string | null;
  frozenTime: string | null;
  rawJobStatus: string;
  matchResult: string;
  action: "CREATE" | "UPDATE" | "ERROR" | "SKIP";
  importStatus: string;
  reasons: string[];
};

type PreviewResponse = {
  sheetName: string;
  totalRows: number;
  rows: PreviewRow[];
  summary: {
    createCount: number;
    updateCount: number;
    errorCount: number;
    skipCount: number;
  };
};

type ImportSummary = {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  totalRows: number;
};

export function LeaderImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importableCount = useMemo(
    () =>
      preview?.rows.filter(
        (row) => row.action === "CREATE" || row.action === "UPDATE",
      ).length || 0,
    [preview],
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] || null);
    setPreview(null);
    setSummary(null);
    setError("");
  }

  async function handlePreview() {
    if (!file) {
      setError("请先选择 .xlsx 文件");
      return;
    }

    setError("");
    setSummary(null);
    setIsPreviewing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/leaders/import/preview", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "解析失败");
        return;
      }

      setPreview(data);
    } catch {
      setError("导入预览请求失败，请稍后重试");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleConfirm() {
    if (!preview) {
      return;
    }

    const ok = window.confirm(
      `确认导入 ${importableCount} 条可导入数据？有错误的行会跳过。`,
    );
    if (!ok) {
      return;
    }

    setError("");
    setIsImporting(true);
    try {
      const response = await fetch("/api/leaders/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.rows }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "确认导入失败");
        return;
      }

      setSummary(data.summary);
    } catch {
      setError("确认导入请求失败，请稍后重试");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="leader-import-file">
              上传队长列表 .xlsx
            </label>
            <Input
              accept=".xlsx"
              id="leader-import-file"
              onChange={handleFileChange}
              type="file"
            />
          </div>
          <Button disabled={isPreviewing} onClick={handlePreview} type="button">
            <Upload className="h-4 w-4" />
            {isPreviewing ? "解析中..." : "解析预览"}
          </Button>
          <Button
            disabled={!preview || importableCount === 0 || isImporting}
            onClick={handleConfirm}
            type="button"
            variant="outline"
          >
            {isImporting ? "导入中..." : "确认导入可导入行"}
          </Button>
        </div>
        {error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {summary ? (
          <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            导入完成：新建 {summary.createdCount}，更新 {summary.updatedCount}，跳过{" "}
            {summary.skippedCount}，错误 {summary.errorCount}。
          </p>
        ) : null}
      </section>

      {preview ? (
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">导入预览</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                工作表：{preview.sheetName}，解析 {preview.totalRows} 行，去重后{" "}
                {preview.rows.length} 行。
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              新建 {preview.summary.createCount} · 更新 {preview.summary.updateCount} ·
              错误 {preview.summary.errorCount}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] border-collapse text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  {[
                    "行号",
                    "动作",
                    "状态",
                    "队长id",
                    "姓名",
                    "昵称",
                    "手机号",
                    "常驻地",
                    "队长身份",
                    "队长级别",
                    "带队次数",
                    "带队天数",
                    "审核时间",
                    "冻结时间",
                    "岗位状态",
                    "匹配结果",
                    "异常原因",
                  ].map((header) => (
                    <th className="px-4 py-3 font-medium" key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr className="border-t" key={`${row.rowNumber}-${row.phone}`}>
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="px-4 py-3">{row.importStatus}</td>
                    <td className="px-4 py-3">{row.externalLeaderId || "-"}</td>
                    <td className="px-4 py-3 font-medium">{row.realName || "-"}</td>
                    <td className="px-4 py-3">{row.nickname || "-"}</td>
                    <td className="px-4 py-3">{row.phone || "-"}</td>
                    <td className="px-4 py-3">{row.residentLocation || "-"}</td>
                    <td className="px-4 py-3">{row.rawLeaderIdentity || "-"}</td>
                    <td className="px-4 py-3 whitespace-pre-line">
                      {row.rawLeaderLevel || "-"}
                    </td>
                    <td className="px-4 py-3">{row.leadCount ?? "-"}</td>
                    <td className="px-4 py-3">{row.leadDays ?? "-"}</td>
                    <td className="px-4 py-3">{formatDate(row.auditTime)}</td>
                    <td className="px-4 py-3">{formatDate(row.frozenTime)}</td>
                    <td className="px-4 py-3">{row.rawJobStatus || "-"}</td>
                    <td className="px-4 py-3">{row.matchResult}</td>
                    <td className="px-4 py-3">{row.reasons.join("；") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActionBadge({ action }: { action: PreviewRow["action"] }) {
  const variant = action === "ERROR" ? "outline" : "secondary";
  return <Badge variant={variant}>{action}</Badge>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toISOString().slice(0, 10);
}
