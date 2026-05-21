import Link from "next/link";
import type { DataCheckCode } from "@/lib/services/data-check";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import { DATA_CHECK_READ_ROLES } from "@/lib/auth/roles";
import {
  DATA_CHECK_GROUPS,
  getDataCheckDashboard,
  type DataCheckIssue,
} from "@/lib/services/data-check";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDataCheckPage({ searchParams }: PageProps) {
  await requireRole(DATA_CHECK_READ_ROLES, "/admin/data-check");
  const params = await searchParams;
  const filters = {
    scoreYearId: getParam(params.scoreYearId),
    checkType: normalizeCheckType(getParam(params.checkType)),
    keyword: getParam(params.keyword),
    onlyIssues: getParam(params.onlyIssues) !== "false",
  };
  const data = await getDataCheckDashboard(filters);
  const hasIssues = data.checkGroups.some((group) => group.total > 0);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">试运营数据核对</h2>
        <p className="text-sm text-muted-foreground">
          本页面用于试运营期间发现账号绑定、团期积分、申请审核、积分台账和奖金测算风险。系统只提示异常，不自动修改数据。
        </p>
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={data.scoreYear?.id || ""}
            name="scoreYearId"
          >
            {data.scoreYears.length > 0 ? null : <option value="">暂无积分年度</option>}
            {data.scoreYears.map((scoreYear) => (
              <option key={scoreYear.id} value={scoreYear.id}>
                {scoreYear.name}
                {scoreYear.status === "ACTIVE" ? "（当前）" : ""}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.checkType || ""}
            name="checkType"
          >
            <option value="">全部异常类型</option>
            {DATA_CHECK_GROUPS.map((group) => (
              <option key={group.code} value={group.code}>
                {group.title}
              </option>
            ))}
          </select>
          <Input
            defaultValue={filters.keyword}
            name="keyword"
            placeholder="队长 / 手机号 / 团期 / 申请 / 规则"
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.onlyIssues ? "true" : "false"}
            name="onlyIssues"
          >
            <option value="true">只看异常</option>
            <option value="false">显示核对分组</option>
          </select>
          <Button type="submit">筛选</Button>
        </div>
      </form>

      {!data.scoreYear ? (
        <div className="space-y-5">
          <section className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无当前积分年度，请先创建积分年度。
            <Button className="ml-3" size="sm" variant="outline" asChild>
              <Link href="/admin/score-years">前往积分年度管理</Link>
            </Button>
          </section>
          <CheckGroupsList groups={data.checkGroups} />
        </div>
      ) : (
        <>
          <section className="mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="队长绑定率" value={`${data.overview.bindingRate.toFixed(2)}%`} />
            <StatCard label="待审核申请" value={String(data.overview.pendingApplicationCount)} />
            <StatCard label="未生成基础积分" value={String(data.overview.missingBaseScoreCount)} />
            <StatCard label="积分异常" value={String(data.overview.scoreRecordAnomalyCount)} />
            <StatCard label="奖金测算风险" value={String(data.overview.bonusRiskCount)} />
            <StatCard label="奖金池累计" value={formatMoney(data.overview.bonusPoolAmount)} />
          </section>

          <section className="mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="队长总数" value={String(data.summary.leaderTotal)} subtle />
            <StatCard label="已绑定 / 未绑定" value={`${data.summary.boundLeaderCount} / ${data.summary.unboundLeaderCount}`} subtle />
            <StatCard label="当前积分年度" value={data.summary.scoreYearName || "-"} subtle />
            <StatCard label="有效 / 作废积分" value={`${data.summary.effectiveScoreRecordCount} / ${data.summary.voidedScoreRecordCount}`} subtle />
            <StatCard label="已完成团期" value={String(data.summary.completedTripCount)} subtle />
            <StatCard label="奖金资格 / 负分" value={`${data.summary.bonusEligibleLeaderCount} / ${data.summary.negativeLeaderCount}`} subtle />
          </section>

          {!hasIssues ? (
            <section className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              当前筛选条件下未发现异常。
            </section>
          ) : (
            <CheckGroupsList groups={data.checkGroups} />
          )}
        </>
      )}
    </div>
  );
}

function CheckGroupsList({
  groups,
}: {
  groups: Array<{
    code: string;
    title: string;
    description: string;
    suggestion: string;
    total: number;
    items: DataCheckIssue[];
  }>;
}) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section className="rounded-lg border bg-card shadow-sm" key={group.code}>
          <div className="flex flex-col gap-2 border-b p-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{group.title}</h3>
                <Badge variant={group.total > 0 ? "secondary" : "outline"}>{group.total} 条</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
              <p className="mt-1 text-sm text-muted-foreground">处理建议：{group.suggestion}</p>
            </div>
          </div>

          {group.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <Th>风险等级</Th>
                    <Th>对象</Th>
                    <Th>异常类型</Th>
                    <Th>关键字段</Th>
                    <Th>处理建议</Th>
                    <Th>操作</Th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr className="border-t" key={item.id}>
                      <Td>
                        <SeverityBadge severity={item.severity} />
                      </Td>
                      <Td className="font-medium">{item.target}</Td>
                      <Td>{item.title}</Td>
                      <Td>
                        <dl className="grid min-w-[420px] grid-cols-2 gap-x-4 gap-y-1">
                          {item.fields.map((field) => (
                            <div key={`${item.id}-${field.label}`}>
                              <dt className="text-muted-foreground">{field.label}</dt>
                              <dd className="font-medium">{field.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </Td>
                      <Td className="max-w-[260px] text-muted-foreground">{item.suggestion}</Td>
                      <Td>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={item.href}>{item.actionLabel}</Link>
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {group.total > group.items.length ? (
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  仅展示前 20 条，请通过筛选进一步处理。
                </p>
              ) : null}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">暂无异常。</div>
          )}
        </section>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtle,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-semibold ${subtle ? "text-xl" : "text-2xl"}`}>{value}</p>
    </article>
  );
}

function SeverityBadge({ severity }: { severity: DataCheckIssue["severity"] }) {
  if (severity === "HIGH") return <Badge variant="destructive">高风险</Badge>;
  if (severity === "MEDIUM") return <Badge variant="secondary">需处理</Badge>;
  return <Badge variant="outline">提示</Badge>;
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

function normalizeCheckType(value: string): DataCheckCode | "" {
  return DATA_CHECK_GROUPS.some((group) => group.code === value)
    ? (value as DataCheckCode)
    : "";
}

function formatMoney(value: number) {
  return `¥${value.toFixed(2)}`;
}
