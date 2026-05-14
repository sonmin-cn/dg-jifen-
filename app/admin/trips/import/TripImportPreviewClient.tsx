"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TripImportPreviewRow } from "@/lib/services/trip-import";

type PreviewResponse = {
  sheetName: string;
  totalRows: number;
  rows: TripImportPreviewRow[];
};

export function TripImportPreviewClient() {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPreview(null);
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

  return (
    <div className="py-8">
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/trips">返回团期列表</Link>
      </Button>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">导入销转表预览</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          本阶段只解析并展示预览，不会写入团期或带队记录。
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
            <Button disabled variant="outline">
              确认导入（后续任务接入）
            </Button>
          </div>
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
