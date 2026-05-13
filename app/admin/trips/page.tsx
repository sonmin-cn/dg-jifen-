import Link from "next/link";
import type { Prisma, TripStatus } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES, TRIP_READ_ROLES } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TRIP_STATUS_LABELS,
  TRIP_STATUS_OPTIONS,
} from "@/lib/constants/trips";
import { tripListSelect } from "@/lib/services/trip-select";
import { TripCreateForm } from "@/app/admin/trips/TripCreateForm";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTripsPage({ searchParams }: PageProps) {
  const user = await requireRole(TRIP_READ_ROLES, "/admin/trips");
  const canManage = TRIP_MANAGEMENT_ROLES.includes(user.role);
  const params = await searchParams;
  const page = Math.max(Number(getParam(params.page) || "1"), 1);
  const pageSize = 10;
  const keyword = getParam(params.keyword);
  const region = getParam(params.region);
  const status = getParam(params.status);
  const dateFrom = getParam(params.dateFrom);
  const dateTo = getParam(params.dateTo);
  const where: Prisma.TripWhereInput = {};

  if (keyword) where.routeName = { contains: keyword };
  if (region) where.region = { contains: region };
  if (status && TRIP_STATUS_OPTIONS.includes(status as TripStatus)) {
    where.status = status as TripStatus;
  }
  if (dateFrom || dateTo) {
    where.startDate = {
      ...(dateFrom ? { gte: parseDate(dateFrom) } : {}),
      ...(dateTo ? { lte: parseDate(dateTo, true) } : {}),
    };
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      select: tripListSelect,
      orderBy: { startDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.trip.count({ where }),
  ]);
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">团期管理</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          维护团期信息和带队记录，基础积分生成将在任务 6 接入。
        </p>
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-6">
          <Input defaultValue={keyword} name="keyword" placeholder="路线名称" />
          <Input defaultValue={region} name="region" placeholder="区域" />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={status}
            name="status"
          >
            <option value="">全部状态</option>
            {TRIP_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TRIP_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <Input defaultValue={dateFrom} name="dateFrom" type="date" />
          <Input defaultValue={dateTo} name="dateTo" type="date" />
          <Button type="submit">
            <Search className="h-4 w-4" />
            搜索
          </Button>
        </div>
      </form>

      <section className="mb-6 overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>路线</Th>
              <Th>区域</Th>
              <Th>日期</Th>
              <Th>天数</Th>
              <Th>人数</Th>
              <Th>状态</Th>
              <Th>带队</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {trips.length > 0 ? (
              trips.map((trip) => (
                <tr className="border-t" key={trip.id}>
                  <Td className="font-medium">{trip.routeName}</Td>
                  <Td>{trip.region || "-"}</Td>
                  <Td>
                    {formatDate(trip.startDate)} 至 {formatDate(trip.endDate)}
                  </Td>
                  <Td>{trip.tripDays}</Td>
                  <Td>{trip.participantCount ?? "-"}</Td>
                  <Td>
                    <TripStatusBadge status={trip.status} />
                  </Td>
                  <Td>{trip.tripLeaders.length}</Td>
                  <Td>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/trips/${trip.id}`}>查看详情</Link>
                    </Button>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={8}>
                  暂无团期数据，调整筛选条件或新增团期。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="mb-8 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {total} 条，第 {page} / {pageCount} 页
        </span>
        <div className="flex gap-2">
          <Button disabled={page <= 1} size="sm" variant="outline" asChild={page > 1}>
            {page > 1 ? <Link href={buildPageHref(params, page - 1)}>上一页</Link> : <span>上一页</span>}
          </Button>
          <Button disabled={page >= pageCount} size="sm" variant="outline" asChild={page < pageCount}>
            {page < pageCount ? <Link href={buildPageHref(params, page + 1)}>下一页</Link> : <span>下一页</span>}
          </Button>
        </div>
      </div>

      {canManage ? <TripCreateForm /> : null}
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
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}

function TripStatusBadge({ status }: { status: TripStatus }) {
  const variant = status === "CANCELLED" ? "outline" : "secondary";
  return <Badge variant={variant}>{TRIP_STATUS_LABELS[status]}</Badge>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function parseDate(value: string, endOfDay = false) {
  return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}+08:00`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildPageHref(
  params: Record<string, string | string[] | undefined>,
  page: number,
) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalized = getParam(value);
    if (normalized && key !== "page") searchParams.set(key, normalized);
  }
  searchParams.set("page", String(page));
  return `/admin/trips?${searchParams.toString()}`;
}
