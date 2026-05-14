"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeaderStatus } from "@prisma/client";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LEADER_LEVEL_OPTIONS,
  LEADER_STATUS_LABELS,
  LEADER_STATUS_OPTIONS,
} from "@/lib/constants/leaders";

type LeaderFormData = {
  id: string;
  realName: string;
  nickname: string | null;
  phone: string;
  region: string | null;
  status: LeaderStatus;
  level: string | null;
  joinDate: Date | string | null;
  recommenderLeaderId: string | null;
  tags: string | null;
  remark: string | null;
};

export function LeaderEditForm({
  leader,
  recommenderOptions,
}: {
  leader: LeaderFormData;
  recommenderOptions: Array<{ id: string; realName: string; nickname: string | null }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeaderStatus>(leader.status);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/leaders/${leader.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setError(
          data.errors
            ? Object.values(data.errors).join("；")
            : data.message || "保存失败",
        );
        return;
      }

      router.refresh();
    } catch {
      setError("保存请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusError("");
    setIsStatusSubmitting(true);

    try {
      const response = await fetch(`/api/leaders/${leader.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatusError(data.message || "状态修改失败");
        return;
      }

      router.refresh();
    } catch {
      setStatusError("状态修改请求失败，请稍后重试");
    } finally {
      setIsStatusSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold">编辑队长档案</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field defaultValue={leader.realName} label="姓名" name="realName" required />
          <Field defaultValue={leader.nickname || ""} label="昵称" name="nickname" />
          <Field defaultValue={leader.phone} label="手机号" name="phone" required />
          <Field defaultValue={leader.region || ""} label="区域" name="region" />
          <input name="status" type="hidden" value={leader.status} />
          <div className="space-y-2">
            <Label htmlFor="level">等级</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              defaultValue={leader.level || ""}
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
          <Field
            defaultValue={formatDateInput(leader.joinDate)}
            label="入职日期"
            name="joinDate"
            type="date"
          />
          <div className="space-y-2">
            <Label htmlFor="recommenderLeaderId">推荐人</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              defaultValue={leader.recommenderLeaderId || ""}
              id="recommenderLeaderId"
              name="recommenderLeaderId"
            >
              <option value="">无</option>
              {recommenderOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.realName}
                  {option.nickname ? `（${option.nickname}）` : ""}
                </option>
              ))}
            </select>
          </div>
          <Field defaultValue={leader.tags || ""} label="标签" name="tags" />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="remark">备注</Label>
            <Textarea
              defaultValue={leader.remark || ""}
              id="remark"
              name="remark"
            />
          </div>
        </div>
        {error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button className="mt-4" disabled={isSubmitting} type="submit">
          <Save className="h-4 w-4" />
          {isSubmitting ? "保存中..." : "保存修改"}
        </Button>
      </form>

      <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleStatusSubmit}>
        <h2 className="text-lg font-semibold">修改状态</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          状态修改会单独写入审计日志。暂停和离职会被记录为停用类操作。
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="status-control">状态</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="status-control"
            onChange={(event) => setStatus(event.target.value as LeaderStatus)}
            value={status}
          >
            {LEADER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {LEADER_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        {statusError ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {statusError}
          </p>
        ) : null}
        <Button className="mt-4 w-full" disabled={isStatusSubmitting} type="submit">
          {isStatusSubmitting ? "更新中..." : "更新状态"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}

function formatDateInput(value: Date | string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}
