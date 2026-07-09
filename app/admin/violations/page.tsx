import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import Link from "next/link";
import type { ScoreCategory, ViolationStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import { VIOLATION_MANAGEMENT_ROLES, VIOLATION_READ_ROLES } from "@/lib/auth/roles";
import {
  SCORE_CATEGORY_LABELS,
  SCORE_CATEGORY_OPTIONS,
} from "@/lib/constants/scores";
import {
  VIOLATION_CONFIGS,
  VIOLATION_RULE_OPTIONS,
  VIOLATION_SEVERITY_LABELS,
  VIOLATION_STATUS_LABELS,
  getViolationRuleLabel,
  isSupportedViolationRuleCode,
} from "@/lib/constants/violations";
import { prisma } from "@/lib/db/prisma";
import { getAdminViolations } from "@/lib/services/violations";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const VIOLATION_STATUS_OPTIONS = Object.keys(VIOLATION_STATUS_LABELS) as ViolationStatus[];

export default async function AdminViolationsPage({ searchParams }: PageProps) {
  const user = await requireRole(VIOLATION_READ_ROLES, "/admin/violations");
  const canCreate = VIOLATION_MANAGEMENT_ROLES.includes(user.role);
  const params = await searchParams;
  const filters = {
    keyword: getParam(params.keyword),
    ruleCode: normalizeRuleCode(getParam(params.ruleCode)),
    category: normalizeCategory(getParam(params.category)),
    leaderId: getParam(params.leaderId),
    tripId: getParam(params.tripId),
    status: normalizeStatus(getParam(params.status)),
    startDate: parseDateParam(getParam(params.startDate), false),
    endDate: parseDateParam(getParam(params.endDate), true),
    page: Math.max(Number(getParam(params.page) || "1"), 1),
    pageSize: Math.max(Number(getParam(params.pageSize) || "20"), 1),
  };
  const [data, leaders, trips] = await Promise.all([
    getAdminViolations(filters),
    prisma.leader.findMany({
      orderBy: { realName: "asc" },
      select: { id: true, realName: true, nickname: true, phone: true },
    }),
    prisma.trip.findMany({
      orderBy: { endDate: "desc" },
      select: { id: true, routeName: true, endDate: true },
      take: 200,
    }),
  ]);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">违规扣分</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            查看和录入违规、投诉、安全与红线事件扣分。
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/admin/violations/new">新增扣分事件</Link>
          </Button>
        ) : null}
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            defaultValue={filters.keyword}
            name="keyword"
            placeholder="队长 / 手机号 / 标题 / 说明 / 路线"
          />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.ruleCode || ""} name="ruleCode">
            <option value="">全部类型</option>
            {VIOLATION_RULE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VIOLATION_CONFIGS[option].label}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.category || ""} name="category">
            <option value="">全部分类</option>
            {SCORE_CATEGORY_OPTIONS.filter((option) =>
              ["VIOLATION", "COMPLAINT", "SAFETY", "REDLINE"].includes(option),
            ).map((option) => (
              <option key={option} value={option}>
                {SCORE_CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.status || ""} name="status">
            <option value="">全部状态</option>
            {VIOLATION_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VIOLATION_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.leaderId} name="leaderId">
            <option value="">全部队长</option>
            {leaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.realName}
                {leader.nickname ? `（${leader.nickname}）` : ""}
                {leader.phone ? ` ****${leader.phone.slice(-4)}` : ""}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.tripId} name="tripId">
            <option value="">全部团期</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.routeName}（{formatDate(trip.endDate)}）
              </option>
            ))}
          </select>
          <Input defaultValue={getParam(params.startDate)} name="startDate" type="date" />
          <Input defaultValue={getParam(params.endDate)} name="endDate" type="date" />
          <Button type="submit">筛选</Button>
        </div>
      </form>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1200px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>发生时间</Th>
              <Th>队长</Th>
              <Th>昵称</Th>
              <Th>扣分类型</Th>
              <Th>关联团期</Th>
              <Th>扣分分值</Th>
              <Th>状态</Th>
              <Th>处理人</Th>
              <Th>创建时间</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {data.events.length > 0 ? (
              data.events.map((event) => (
                <tr className="border-t" key={event.id}>
                  <Td>{formatDateTime(event.occurredAt)}</Td>
                  <Td className="font-medium">{event.leader.realName}</Td>
                  <Td>{event.leader.nickname || "-"}</Td>
                  <Td>
                    <div className="font-medium">{getViolationRuleLabel(event.ruleCode)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {event.rule?.category ? SCORE_CATEGORY_LABELS[event.rule.category] : "-"} ·{" "}
                      {VIOLATION_SEVERITY_LABELS[event.severity]}
                    </div>
                  </Td>
                  <Td>{event.trip?.routeName || "未关联团期"}</Td>
                  <Td className="font-semibold">{formatPoints(event.points)}</Td>
                  <Td>
                    <Badge variant={event.status === "EFFECTIVE" ? "secondary" : "outline"}>
                      {VIOLATION_STATUS_LABELS[event.status]}
                    </Badge>
                  </Td>
                  <Td>{event.handledBy || event.approvedBy || "-"}</Td>
                  <Td>{formatDateTime(event.createdAt)}</Td>
                  <Td>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/violations/${event.id}`}>查看详情</Link>
                    </Button>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={10}>
                  暂无扣分事件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {data.pagination.total} 条，第 {data.pagination.page} /{" "}
          {data.pagination.pageCount} 页
        </span>
        <div className="flex gap-2">
          <Button
            disabled={data.pagination.page <= 1}
            size="sm"
            variant="outline"
            asChild={data.pagination.page > 1}
          >
            {data.pagination.page > 1 ? (
              <Link href={buildPageHref(params, data.pagination.page - 1)}>上一页</Link>
            ) : (
              <span>上一页</span>
            )}
          </Button>
          <Button
            disabled={data.pagination.page >= data.pagination.pageCount}
            size="sm"
            variant="outline"
            asChild={data.pagination.page < data.pagination.pageCount}
          >
            {data.pagination.page < data.pagination.pageCount ? (
              <Link href={buildPageHref(params, data.pagination.page + 1)}>下一页</Link>
            ) : (
              <span>下一页</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className || ""}`}>{children}</td>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function normalizeRuleCode(value: string) {
  return isSupportedViolationRuleCode(value) ? value : undefined;
}

function normalizeCategory(value: string): ScoreCategory | undefined {
  return SCORE_CATEGORY_OPTIONS.includes(value as ScoreCategory)
    ? (value as ScoreCategory)
    : undefined;
}

function normalizeStatus(value: string): ViolationStatus | undefined {
  return VIOLATION_STATUS_OPTIONS.includes(value as ViolationStatus)
    ? (value as ViolationStatus)
    : undefined;
}

function parseDateParam(value: string, endOfDay: boolean) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}+08:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildPageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const param = getParam(value);
    if (param && key !== "page") search.set(key, param);
  }
  search.set("page", String(page));
  return `/admin/violations?${search.toString()}`;
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return formatDateTimeCN(value);
}

function formatDate(value: Date) {
  return formatDateCN(value);
}

function formatPoints(value: number) {
  if (value === 0) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
