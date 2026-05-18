import Link from "next/link";
import type { ScoreCategory } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import {
  SCORE_ADJUSTMENT_MANAGEMENT_ROLES,
  SCORE_ADJUSTMENT_READ_ROLES,
} from "@/lib/auth/roles";
import {
  SCORE_CATEGORY_LABELS,
  SCORE_CATEGORY_OPTIONS,
  SCORE_RECORD_STATUS_LABELS,
} from "@/lib/constants/scores";
import { prisma } from "@/lib/db/prisma";
import { getAdminScoreAdjustments } from "@/lib/services/score-adjustments";
import { formatScorePoints } from "@/lib/services/score-records";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminScoreAdjustmentsPage({ searchParams }: PageProps) {
  const user = await requireRole(SCORE_ADJUSTMENT_READ_ROLES, "/admin/score-adjustments");
  const canCreate = SCORE_ADJUSTMENT_MANAGEMENT_ROLES.includes(user.role);
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
    ruleCode: getParam(params.ruleCode),
    category: normalizeCategory(getParam(params.category)),
    startDate: parseDateParam(getParam(params.startDate), false),
    endDate: parseDateParam(getParam(params.endDate), true),
    page: Math.max(Number(getParam(params.page) || "1"), 1),
    pageSize: Math.max(Number(getParam(params.pageSize) || "20"), 1),
  };
  const [data, scoreYears, leaders, ruleCodes] = await Promise.all([
    getAdminScoreAdjustments(filters),
    prisma.scoreYear.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.leader.findMany({
      orderBy: { realName: "asc" },
      select: { id: true, realName: true, nickname: true, phone: true },
    }),
    prisma.scoreRule.findMany({
      orderBy: { code: "asc" },
      distinct: ["code"],
      select: { code: true },
    }),
  ]);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">专项加分与积分补录</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            查看后台确认型加分和历史补录记录。新增补录时规则来自 ScoreRule 表，不在代码中固定加分行为。
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/admin/score-adjustments/new">新增专项加分</Link>
          </Button>
        ) : null}
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Input defaultValue={filters.keyword} name="keyword" placeholder="队长 / 规则 / 原因 / 团期" />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.scoreYearId} name="scoreYearId">
            <option value="">全部年度</option>
            {scoreYears.map((scoreYear) => (
              <option key={scoreYear.id} value={scoreYear.id}>
                {scoreYear.name}
                {scoreYear.status === "ACTIVE" ? "（当前）" : ""}
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
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.ruleCode} name="ruleCode">
            <option value="">全部规则 code</option>
            {ruleCodes.map((rule) => (
              <option key={rule.code} value={rule.code}>
                {rule.code}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.category || ""} name="category">
            <option value="">全部分类</option>
            {SCORE_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
          <Input defaultValue={getParam(params.startDate)} name="startDate" type="date" />
          <Input defaultValue={getParam(params.endDate)} name="endDate" type="date" />
          <Button type="submit">筛选</Button>
        </div>
      </form>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1400px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>创建时间</Th>
              <Th>队长</Th>
              <Th>积分年度</Th>
              <Th>规则名称</Th>
              <Th>规则编码</Th>
              <Th>加分分值</Th>
              <Th>关联团期</Th>
              <Th>原因 / 证据</Th>
              <Th>操作人</Th>
              <Th>状态</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {data.records.length > 0 ? (
              data.records.map((record) => (
                <tr className="border-t" key={record.id}>
                  <Td>{formatDateTime(record.createdAt)}</Td>
                  <Td className="font-medium">
                    {record.leader.realName}
                    {record.leader.nickname ? `（${record.leader.nickname}）` : ""}
                  </Td>
                  <Td>{record.scoreYear.name}</Td>
                  <Td>{record.ruleName || record.rule?.name || record.item}</Td>
                  <Td className="font-mono">{record.ruleCode || record.rule?.code || "-"}</Td>
                  <Td className="font-semibold">{formatScorePoints(record.effectivePoints)}</Td>
                  <Td>{record.trip?.routeName || "未关联团期"}</Td>
                  <Td className="max-w-[300px] whitespace-pre-wrap">{record.remark || "-"}</Td>
                  <Td>{record.approvedBy || "-"}</Td>
                  <Td>
                    <Badge variant={record.status === "EFFECTIVE" ? "secondary" : "outline"}>
                      {SCORE_RECORD_STATUS_LABELS[record.status]}
                    </Badge>
                  </Td>
                  <Td>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/score-records/${record.id}`}>查看积分详情</Link>
                    </Button>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={11}>
                  暂无专项加分记录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {data.pagination.total} 条，第 {data.pagination.page} / {data.pagination.pageCount} 页
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

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className || ""}`}>{children}</td>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function normalizeCategory(value: string): ScoreCategory | undefined {
  return SCORE_CATEGORY_OPTIONS.includes(value as ScoreCategory) ? (value as ScoreCategory) : undefined;
}

function parseDateParam(value: string, endOfDay: boolean) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildPageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized && key !== "page") search.set(key, normalized);
  }
  search.set("page", String(page));
  return `/admin/score-adjustments?${search.toString()}`;
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
}
