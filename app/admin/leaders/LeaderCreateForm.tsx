"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LEADER_LEVEL_OPTIONS,
  LEADER_STATUS_LABELS,
  LEADER_STATUS_OPTIONS,
} from "@/lib/constants/leaders";

export function LeaderCreateForm({
  recommenderOptions,
}: {
  recommenderOptions: Array<{ id: string; realName: string; nickname: string | null }>;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/leaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        message?: string;
        leader?: { id: string };
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setError(
          data.errors
            ? Object.values(data.errors).join("；")
            : data.message || "新增失败",
        );
        return;
      }

      event.currentTarget.reset();
      router.refresh();
      if (data.leader?.id) {
        router.push(`/admin/leaders/${data.leader.id}`);
      }
    } catch {
      setError("新增请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">新增队长</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          创建队长档案后，可在详情页继续维护状态和备注。
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="姓名" name="realName" required />
        <Field label="昵称" name="nickname" />
        <Field label="手机号" name="phone" required />
        <Field label="区域" name="region" />
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            defaultValue="INTERN"
            id="status"
            name="status"
            required
          >
            {LEADER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {LEADER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">等级</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="level"
            name="level"
          >
            <option value="">未设置</option>
            {LEADER_LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <Field label="入职日期" name="joinDate" type="date" />
        <Field label="转正日期" name="regularDate" type="date" />
        <div className="space-y-2">
          <Label htmlFor="recommenderLeaderId">推荐人</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="recommenderLeaderId"
            name="recommenderLeaderId"
          >
            <option value="">无</option>
            {recommenderOptions.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.realName}
                {leader.nickname ? `（${leader.nickname}）` : ""}
              </option>
            ))}
          </select>
        </div>
        <Field label="标签" name="tags" />
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="remark">备注</Label>
          <Textarea id="remark" name="remark" placeholder="可选" />
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button className="mt-4" disabled={isSubmitting} type="submit">
        <Plus className="h-4 w-4" />
        {isSubmitting ? "保存中..." : "新增队长"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} type={type} />
    </div>
  );
}
