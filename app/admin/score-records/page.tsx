import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import Link from "next/link";
import type {
  ScoreCategory,
  ScoreDirection,
  ScoreRecordStatus,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RECORD_READ_ROLES } from "@/lib/auth/roles";
import {
  SCORE_CATEGORY_LABELS,
  SCORE_CATEGORY_OPTIONS,
  SCORE_DIRECTION_LABELS,
  SCORE_DIRECTION_OPTIONS,
  SCORE_RECORD_STATUS_LABELS,
  SCORE_RECORD_STATUS_OPTIONS,
} from "@/lib/constants/scores";
import { prisma } from "@/lib/db/prisma";
import { formatLeaderDisplayLevel } from "@/lib/constants/leaders";
import {
  formatScorePoints,
  getAdminScoreRecords,
} from "@/lib/services/score-records";
import { SearchableSelect } from "@/app/admin/components/SearchableSelect";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminScoreRecordsPage({ searchParams }: PageProps) {
  await requireRole(SCORE_RECORD_READ_ROLES, "/admin/score-records");
  const params = await searchParams;
  const activeScoreYear = await prisma.scoreYear.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    select: { id: true },
  });
  const filters = {
    keyword: getParam(params.keyword),
    scoreYearId: getParam(params.scoreYearId) || activeScoreYear?.id || "",
    leaderId: getParam(params.leaderId),
    category: normalizeCategory(getParam(params.category)),
    direction: normalizeDirection(getParam(params.direction)),
    status: normalizeStatus(getParam(params.status)),
    startDate: parseDateParam(getParam(params.startDate), false),
    endDate: parseDateParam(getParam(params.endDate), true),
    page: Math.max(Number(getParam(params.page) || "1"), 1),
    pageSize: Math.max(Number(getParam(params.pageSize) || "20"), 1),
  };
  const [data, scoreYears, leaders] = await Promise.all([
    getAdminScoreRecords(filters),
    prisma.scoreYear.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.leader.findMany({
      orderBy: { realName: "asc" },
      select: {
        id: true,
        realName: true,
        nickname: true,
        phone: true,
        externalLeaderId: true,
        status: true,
        level: true,
      },
    }),
  ]);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">积分台账</h2>
        <p className="text-sm text-muted-foreground">
          查看全部队长积分记录、来源团期、规则快照和筛选统计。
        </p>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-5">
        <StatCard label="有效总积分" value={formatPlainPoints(data.stats.effectiveTotalPoints)} />
        <StatCard label="加分合计" value={formatPlainPoints(data.stats.addPoints)} />
        <StatCard label="扣分合计" value={formatPlainPoints(data.stats.deductPoints)} />
        <StatCard label="记录数" value={String(data.stats.recordCount)} />
        <StatCard label="涉及队长数" value={String(data.stats.leaderCount)} />
      </section>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            defaultValue={filters.keyword}
            name="keyword"
            placeholder="队长 / 手机号 / 项目 / 备注 / 路线"
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.scoreYearId}
            name="scoreYearId"
          >
            <option value="">全部年度</option>
            {scoreYears.map((scoreYear) => (
              <option key={scoreYear.id} value={scoreYear.id}>
                {scoreYear.name}
                {scoreYear.status === "ACTIVE" ? "（当前）" : ""}
              </option>
            ))}
          </select>
          <SearchableSelect
            emptyText="未找到匹配队长"
            name="leaderId"
            options={leaders.map((leader) => ({
              id: leader.id,
              label: `${leader.realName}${leader.nickname ? ` / ${leader.nickname}` : ""}${leader.phone ? ` / ${maskPhone(leader.phone)}` : ""} / ${leader.status} / ${formatLeaderDisplayLevel(leader.status, leader.level)}`,
              searchText: `${leader.realName} ${leader.nickname || ""} ${leader.phone || ""} ${leader.externalLeaderId || ""} ${leader.status} ${leader.level || ""}`,
            }))}
            placeholder="全部队长 / 搜索姓名昵称手机号"
            value={filters.leaderId}
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.category || ""}
            name="category"
          >
            <option value="">全部分类</option>
            {SCORE_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.direction || ""}
            name="direction"
          >
            <option value="">全部方向</option>
            {SCORE_DIRECTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_DIRECTION_LABELS[option]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.status || ""}
            name="status"
          >
            <option value="">全部状态</option>
            {SCORE_RECORD_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_RECORD_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <Input
            defaultValue={getParam(params.startDate)}
            name="startDate"
            type="date"
          />
          <Input
            defaultValue={getParam(params.endDate)}
            name="endDate"
            type="date"
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={String(data.pagination.pageSize)}
            name="pageSize"
          >
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                每页 {size} 条
              </option>
            ))}
          </select>
          <Button type="submit">筛选</Button>
        </div>
      </form>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1500px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>发生时间</Th>
              <Th>队长</Th>
              <Th>昵称</Th>
              <Th>手机号</Th>
              <Th>积分年度</Th>
              <Th>积分项目</Th>
              <Th>分类</Th>
              <Th>方向</Th>
              <Th>分值</Th>
              <Th>状态</Th>
              <Th>关联团期</Th>
              <Th>规则名称</Th>
              <Th>规则编码</Th>
              <Th>备注</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {data.records.length > 0 ? (
              data.records.map((record) => (
                <tr
                  className={`border-t ${record.status === "VOIDED" ? "bg-muted/40 text-muted-foreground" : ""}`}
                  key={record.id}
                >
                  <Td>{formatDate(record.occurredAt)}</Td>
                  <Td className="font-medium">{record.leader.realName}</Td>
                  <Td>{record.leader.nickname || "-"}</Td>
                  <Td>{maskPhone(record.leader.phone)}</Td>
                  <Td>{record.scoreYear.name}</Td>
                  <Td>{record.item}</Td>
                  <Td>{SCORE_CATEGORY_LABELS[record.category]}</Td>
                  <Td>
                    <Badge variant={record.direction === "ADD" ? "secondary" : "outline"}>
                      {SCORE_DIRECTION_LABELS[record.direction]}
                    </Badge>
                  </Td>
                  <Td className="font-semibold">
                    {formatScorePoints(
                      record.direction === "DEDUCT" && record.effectivePoints > 0
                        ? -record.effectivePoints
                        : record.effectivePoints,
                    )}
                  </Td>
                  <Td>
                    <Badge variant={record.status === "VOIDED" ? "outline" : "secondary"}>
                      {SCORE_RECORD_STATUS_LABELS[record.status]}
                    </Badge>
                  </Td>
                  <Td>{record.trip?.routeName || "未关联团期"}</Td>
                  <Td>{record.ruleName || record.rule?.name || "-"}</Td>
                  <Td>{record.ruleCode || record.rule?.code || "-"}</Td>
                  <Td className="max-w-[280px] whitespace-normal">
                    {record.remark || "-"}
                  </Td>
                  <Td>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/score-records/${record.id}`}>查看详情</Link>
                    </Button>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={15}>
                  暂无积分记录
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
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

function normalizeCategory(value: string): ScoreCategory | undefined {
  return SCORE_CATEGORY_OPTIONS.includes(value as ScoreCategory)
    ? (value as ScoreCategory)
    : undefined;
}

function normalizeDirection(value: string): ScoreDirection | undefined {
  return SCORE_DIRECTION_OPTIONS.includes(value as ScoreDirection)
    ? (value as ScoreDirection)
    : undefined;
}

function normalizeStatus(value: string): ScoreRecordStatus | undefined {
  return SCORE_RECORD_STATUS_OPTIONS.includes(value as ScoreRecordStatus)
    ? (value as ScoreRecordStatus)
    : undefined;
}

function parseDateParam(value: string, endOfDay: boolean) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}+08:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDate(value: Date) {
  return formatDateCN(value);
}

function formatPlainPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function maskPhone(phone: string) {
  return phone.length >= 4 ? `****${phone.slice(-4)}` : "****";
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
  return `/admin/score-records?${searchParams.toString()}`;
}
