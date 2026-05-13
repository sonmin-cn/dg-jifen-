import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import {
  LEADER_LEVEL_OPTIONS,
  LEADER_STATUS_LABELS,
  LEADER_STATUS_OPTIONS,
} from "@/lib/constants/leaders";
import { leaderDetailSelect } from "@/lib/services/leader-select";
import { LeaderCreateForm } from "@/app/admin/leaders/LeaderCreateForm";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLeadersPage({ searchParams }: PageProps) {
  await requireRole(LEADER_MANAGEMENT_ROLES, "/admin/leaders");
  const params = await searchParams;
  const page = Math.max(Number(getParam(params.page) || "1"), 1);
  const pageSize = 10;
  const keyword = getParam(params.keyword);
  const region = getParam(params.region);
  const status = getParam(params.status);
  const level = getParam(params.level);
  const where: Prisma.LeaderWhereInput = {};

  if (keyword) {
    where.OR = [
      { realName: { contains: keyword } },
      { nickname: { contains: keyword } },
      { phone: { contains: keyword } },
    ];
  }

  if (region) {
    where.region = { contains: region };
  }

  if (status && LEADER_STATUS_OPTIONS.includes(status as never)) {
    where.status = status as never;
  }

  if (level && LEADER_LEVEL_OPTIONS.includes(level)) {
    where.level = level;
  }

  const [leaders, total, recommenderOptions] = await Promise.all([
    prisma.leader.findMany({
      where,
      select: leaderDetailSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.leader.count({ where }),
    prisma.leader.findMany({
      select: {
        id: true,
        realName: true,
        nickname: true,
      },
      orderBy: { realName: "asc" },
    }),
  ]);
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">队长档案</h2>
        <p className="text-sm text-muted-foreground">
          管理队长基础资料、状态、等级、推荐关系和备注。
        </p>
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            defaultValue={keyword}
            name="keyword"
            placeholder="姓名 / 昵称 / 手机号"
          />
          <Input defaultValue={region} name="region" placeholder="区域" />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={status}
            name="status"
          >
            <option value="">全部状态</option>
            {LEADER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {LEADER_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={level}
            name="level"
          >
            <option value="">全部等级</option>
            {LEADER_LEVEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
              <Th>姓名</Th>
              <Th>昵称</Th>
              <Th>手机号</Th>
              <Th>区域</Th>
              <Th>状态</Th>
              <Th>等级</Th>
              <Th>推荐人</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {leaders.length > 0 ? (
              leaders.map((leader) => (
                <tr className="border-t" key={leader.id}>
                  <Td className="font-medium">{leader.realName}</Td>
                  <Td>{leader.nickname || "-"}</Td>
                  <Td>{leader.phone}</Td>
                  <Td>{leader.region || "-"}</Td>
                  <Td>
                    <LeaderStatusBadge status={leader.status} />
                  </Td>
                  <Td>{leader.level || "-"}</Td>
                  <Td>{leader.recommenderLeader?.realName || "-"}</Td>
                  <Td>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/leaders/${leader.id}`}>查看详情</Link>
                    </Button>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={8}>
                  暂无队长数据，调整筛选条件或新增队长。
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
            {page > 1 ? (
              <Link href={buildPageHref(params, page - 1)}>上一页</Link>
            ) : (
              <span>上一页</span>
            )}
          </Button>
          <Button
            disabled={page >= pageCount}
            size="sm"
            variant="outline"
            asChild={page < pageCount}
          >
            {page < pageCount ? (
              <Link href={buildPageHref(params, page + 1)}>下一页</Link>
            ) : (
              <span>下一页</span>
            )}
          </Button>
        </div>
      </div>

      <LeaderCreateForm recommenderOptions={recommenderOptions} />
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

function LeaderStatusBadge({ status }: { status: keyof typeof LEADER_STATUS_LABELS }) {
  const variant =
    status === "LEFT" || status === "SUSPENDED" ? "outline" : "secondary";

  return <Badge variant={variant}>{LEADER_STATUS_LABELS[status]}</Badge>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function buildPageHref(
  params: Record<string, string | string[] | undefined>,
  page: number,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const normalized = getParam(value);
    if (normalized && key !== "page") {
      searchParams.set(key, normalized);
    }
  }

  searchParams.set("page", String(page));
  return `/admin/leaders?${searchParams.toString()}`;
}
