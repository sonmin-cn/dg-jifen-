"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { TripLeaderRole, TripStatus } from "@prisma/client";
import { Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/app/admin/components/SearchableSelect";
import {
  TRIP_LEADER_ROLE_LABELS,
  TRIP_LEADER_ROLE_OPTIONS,
  TRIP_STATUS_LABELS,
  TRIP_STATUS_OPTIONS,
} from "@/lib/constants/trips";

type LeaderOption = {
  id: string;
  realName: string;
  nickname: string | null;
  phone: string;
  status: string;
  level: string | null;
  externalLeaderId: string | null;
};

type TripFormData = {
  id: string;
  routeName: string;
  region: string | null;
  startDate: Date | string;
  endDate: Date | string;
  tripDays: number;
  status: TripStatus;
  participantCount: number | null;
  productManagerId: string | null;
  isHoliday: boolean;
};

type TripLeaderRow = {
  id: string;
  leaderId: string;
  role: TripLeaderRole;
  actualWorkDays: number;
  isCompleted: boolean;
  baseScoreGeneratedAt: Date | string | null;
  baseScoreRecordId: string | null;
  leader: {
    id: string;
    realName: string;
    nickname: string | null;
    phone: string;
  };
};

export function TripEditForm({ trip }: { trip: TripFormData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [statusError, setStatusError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
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
      const response = await fetch(`/api/trips/${trip.id}/status`, {
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
        <h2 className="text-lg font-semibold">编辑团期</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field defaultValue={trip.routeName} label="路线名称" name="routeName" required />
          <Field defaultValue={trip.region || ""} label="区域" name="region" />
          <Field defaultValue={formatDateInput(trip.startDate)} label="出发日期" name="startDate" required type="date" />
          <Field defaultValue={formatDateInput(trip.endDate)} label="结束日期" name="endDate" required type="date" />
          <Field defaultValue={String(trip.tripDays)} label="行程天数" name="tripDays" required step="0.5" type="number" />
          <Field defaultValue={trip.participantCount?.toString() || ""} label="出团人数" name="participantCount" type="number" />
          <Field defaultValue={trip.productManagerId || ""} label="产品经理ID" name="productManagerId" />
          <input name="status" type="hidden" value={trip.status} />
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={trip.isHoliday} name="isHoliday" type="checkbox" />
            节假日团期
          </label>
        </div>
        {error ? <ErrorText text={error} /> : null}
        <Button className="mt-4" disabled={isSubmitting} type="submit">
          <Save className="h-4 w-4" />
          {isSubmitting ? "保存中..." : "保存修改"}
        </Button>
      </form>

      <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleStatusSubmit}>
        <h2 className="text-lg font-semibold">修改状态</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          已取消团期后续不会生成基础带队积分。
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="trip-status">状态</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="trip-status"
            onChange={(event) => setStatus(event.target.value as TripStatus)}
            value={status}
          >
            {TRIP_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TRIP_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        {statusError ? <ErrorText text={statusError} /> : null}
        <Button className="mt-4 w-full" disabled={isStatusSubmitting} type="submit">
          {isStatusSubmitting ? "更新中..." : "更新状态"}
        </Button>
      </form>
    </div>
  );
}

export function TripLeaderManager({
  baseScoreRecordMap,
  tripId,
  tripStatus,
  leaders,
  tripLeaders,
}: {
  baseScoreRecordMap: Record<string, { effectivePoints: number; rawPoints: number }>;
  tripId: string;
  tripStatus: TripStatus;
  leaders: LeaderOption[];
  tripLeaders: TripLeaderRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const generationState = getGenerationState(tripStatus, tripLeaders);

  async function addTripLeader(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`/api/trips/${tripId}/leaders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      message?: string;
      errors?: Record<string, string>;
    };

    if (!response.ok) {
      setError(data.errors ? Object.values(data.errors).join("；") : data.message || "添加失败");
      return;
    }

    form.reset();
    router.refresh();
  }

  async function updateTripLeader(event: FormEvent<HTMLFormElement>, rowId: string) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(`/api/trips/${tripId}/leaders/${rowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      message?: string;
      errors?: Record<string, string>;
    };

    if (!response.ok) {
      setError(data.errors ? Object.values(data.errors).join("；") : data.message || "更新失败");
      return;
    }

    router.refresh();
  }

  async function removeTripLeader(rowId: string) {
    setError("");
    setSuccess("");
    const response = await fetch(`/api/trips/${tripId}/leaders/${rowId}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(data.message || "删除失败");
      return;
    }

    router.refresh();
  }

  async function generateBaseScore() {
    setError("");
    setSuccess("");
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/trips/${tripId}/generate-base-score`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setError(data?.message || "生成基础积分失败");
        return;
      }

      setSuccess(data?.message || "基础积分已生成");
      router.refresh();
    } catch {
      setError("生成基础积分请求失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="mt-5 rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">带队记录</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            管理本团期的带队队长、角色和实际带队天数。
          </p>
        </div>
        <Button
          disabled={generationState.disabled || isGenerating}
          onClick={generateBaseScore}
          type="button"
          variant="outline"
        >
          {isGenerating ? "生成中..." : "生成基础积分"}
        </Button>
      </div>
      {generationState.reason ? (
        <p className="mb-4 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {generationState.reason}
        </p>
      ) : null}

      <form className="mb-5 grid gap-3 md:grid-cols-5" onSubmit={addTripLeader}>
        <LeaderSelect leaders={leaders} name="leaderId" />
        <RoleSelect name="role" />
        <Input name="actualWorkDays" placeholder="实际天数" required step="0.5" type="number" />
        <label className="flex items-center gap-2 text-sm">
          <input name="isCompleted" type="checkbox" />
          已完成
        </label>
        <Button type="submit">添加队长</Button>
      </form>

      {error ? <ErrorText text={error} /> : null}
      {success ? (
        <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {success}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-4 py-3">队长</th>
              <th className="px-4 py-3">基础积分</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">实际天数</th>
              <th className="px-4 py-3">完成</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {tripLeaders.length > 0 ? (
              tripLeaders.map((row) => (
                <tr className="border-t" key={row.id}>
                  <td className="px-4 py-3">
                    {row.leader.realName}
                    {row.leader.nickname ? `（${row.leader.nickname}）` : ""}
                    <p className="text-xs text-muted-foreground">{row.leader.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <BaseScoreStatus
                      generatedAt={row.baseScoreGeneratedAt}
                      scoreRecord={
                        row.baseScoreRecordId
                          ? baseScoreRecordMap[row.baseScoreRecordId]
                          : undefined
                      }
                    />
                  </td>
                  <td className="px-4 py-3" colSpan={4}>
                    <form
                      className="grid gap-3 md:grid-cols-4"
                      onSubmit={(event) => updateTripLeader(event, row.id)}
                    >
                      <input name="leaderId" type="hidden" value={row.leaderId} />
                      <RoleSelect defaultValue={row.role} name="role" />
                      <Input defaultValue={row.actualWorkDays} name="actualWorkDays" required step="0.5" type="number" />
                      <label className="flex items-center gap-2 text-sm">
                        <input defaultChecked={row.isCompleted} name="isCompleted" type="checkbox" />
                        已完成
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" type="submit">保存</Button>
                        <Button
                          disabled={Boolean(row.baseScoreRecordId)}
                          onClick={() => removeTripLeader(row.id)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                  暂无带队记录，请添加队长。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BaseScoreStatus({
  generatedAt,
  scoreRecord,
}: {
  generatedAt: Date | string | null;
  scoreRecord?: { effectivePoints: number; rawPoints: number };
}) {
  if (!generatedAt) {
    return <Badge variant="outline">未生成</Badge>;
  }

  return (
    <div className="space-y-1">
      <Badge variant="secondary">已生成</Badge>
      <p className="text-xs text-muted-foreground">
        {scoreRecord ? `${scoreRecord.effectivePoints} 分` : "积分记录已生成"}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatDateTime(generatedAt)}
      </p>
    </div>
  );
}

function getGenerationState(status: TripStatus, tripLeaders: TripLeaderRow[]) {
  if (status === "PLANNED") {
    return { disabled: true, reason: "仅已完成团期可生成基础积分" };
  }

  if (status === "CANCELLED") {
    return { disabled: true, reason: "取消团不可生成基础积分" };
  }

  const validRows = tripLeaders.filter(
    (row) => row.isCompleted && row.actualWorkDays > 0,
  );
  const invalidRows = tripLeaders.filter(
    (row) => row.isCompleted && !row.baseScoreRecordId && row.actualWorkDays <= 0,
  );

  if (invalidRows.length > 0) {
    return {
      disabled: true,
      reason: "存在实际带队天数无效的已完成带队记录，请先修正",
    };
  }

  if (validRows.length === 0) {
    return { disabled: true, reason: "暂无可生成积分的带队记录" };
  }

  if (validRows.every((row) => row.baseScoreRecordId)) {
    return { disabled: true, reason: "基础积分已全部生成" };
  }

  return { disabled: false, reason: "" };
}

function Field({
  defaultValue,
  label,
  name,
  required,
  step,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  step?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={defaultValue} id={name} name={name} required={required} step={step} type={type} />
    </div>
  );
}

function LeaderSelect({
  leaders,
  name,
}: {
  leaders: LeaderOption[];
  name: string;
}) {
  return (
    <SearchableSelect
      emptyText="未找到匹配队长"
      name={name}
      options={leaders.map((leader) => ({
        id: leader.id,
        label: `${leader.realName}${leader.nickname ? ` / ${leader.nickname}` : ""}${leader.phone ? ` / ****${leader.phone.slice(-4)}` : ""} / ${leader.status}${leader.level ? ` / ${leader.level}` : ""}`,
        searchText: `${leader.realName} ${leader.nickname || ""} ${leader.phone || ""} ${leader.externalLeaderId || ""} ${leader.status} ${leader.level || ""}`,
      }))}
      placeholder="搜索姓名 / 昵称 / 手机号 / 队长ID"
      required
    />
  );
}

function RoleSelect({
  defaultValue = "MAIN",
  name,
}: {
  defaultValue?: TripLeaderRole;
  name: string;
}) {
  return (
    <select
      className="h-10 rounded-md border bg-background px-3 text-sm"
      defaultValue={defaultValue}
      name={name}
    >
      {TRIP_LEADER_ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {TRIP_LEADER_ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {text}
    </p>
  );
}

function formatDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDateTime(value: Date | string) {
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
}
