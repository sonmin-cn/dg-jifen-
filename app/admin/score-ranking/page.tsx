import Link from "next/link";
import type { LeaderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RANKING_READ_ROLES } from "@/lib/auth/roles";
import {
  LEADER_LEVEL_OPTIONS,
  LEADER_STATUS_LABELS,
  LEADER_STATUS_OPTIONS,
  formatLeaderDisplayLevel,
} from "@/lib/constants/leaders";
import {
  formatRankingPoints,
  getAdminScoreRanking,
} from "@/lib/services/score-ranking";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminScoreRankingPage({ searchParams }: PageProps) {
  await requireRole(SCORE_RANKING_READ_ROLES, "/admin/score-ranking");
  const params = await searchParams;
  const filters = {
    scoreYearId: getParam(params.scoreYearId),
    leaderStatus: normalizeLeaderStatus(getParam(params.leaderStatus)),
    level: getParam(params.level),
    region: getParam(params.region),
    keyword: getParam(params.keyword),
    bonusEligible: normalizeBonusEligible(getParam(params.bonusEligible)),
    limit: normalizeLimit(getParam(params.limit)),
  };
  const data = await getAdminScoreRanking(filters);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">积分排行榜</h2>
        <p className="text-sm text-muted-foreground">
          排行榜仅统计已生效积分，作废积分不计入。奖金资格为初步判断，最终以公司年终公告为准。
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
            defaultValue={filters.leaderStatus || ""}
            name="leaderStatus"
          >
            <option value="">全部状态</option>
            {LEADER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {LEADER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.level}
            name="level"
          >
            <option value="">全部等级</option>
            {LEADER_LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <Input defaultValue={filters.region} name="region" placeholder="区域 / 常驻地" />
          <Input defaultValue={filters.keyword} name="keyword" placeholder="姓名 / 昵称 / 手机号 / 队长ID" />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters.bonusEligible || ""}
            name="bonusEligible"
          >
            <option value="">奖金资格：全部</option>
            <option value="true">已满足</option>
            <option value="false">未满足</option>
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={String(data.limit)}
            name="limit"
          >
            <option value="50">前 50</option>
            <option value="100">前 100</option>
            <option value="all">全部</option>
          </select>
          <Button type="submit">筛选</Button>
        </div>
      </form>

      {!data.scoreYear ? (
        <section className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          暂无当前积分年度，请先创建积分年度。
        </section>
      ) : (
        <>
          <section className="mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-7">
            <StatCard label="排行榜人数" value={String(data.summary.rankingCount)} />
            <StatCard label="总有效积分" value={formatRankingPoints(data.summary.totalPoints)} />
            <StatCard label="平均积分" value={formatRankingPoints(data.summary.averagePoints)} />
            <StatCard label="最高积分" value={formatRankingPoints(data.summary.highestPoints)} />
            <StatCard label="已满足奖金资格" value={String(data.summary.eligibleCount)} />
            <StatCard label="未满足奖金资格" value={String(data.summary.ineligibleCount)} />
            <StatCard label="扣分人数" value={String(data.summary.deductLeaderCount)} />
          </section>

          <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
            <table className="min-w-[1900px] w-full border-collapse text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <Th>排名</Th>
                  <Th>队长</Th>
                  <Th>昵称</Th>
                  <Th>手机号</Th>
                  <Th>状态</Th>
                  <Th>等级</Th>
                  <Th>区域 / 常驻地</Th>
                  <Th>总有效积分</Th>
                  <Th>基础带队</Th>
                  <Th>申请加分</Th>
                  <Th>节假日</Th>
                  <Th>其他加分</Th>
                  <Th>扣分合计</Th>
                  <Th>记录数</Th>
                  <Th>带队次数</Th>
                  <Th>带队天数</Th>
                  <Th>奖金资格</Th>
                  <Th>操作</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length > 0 ? (
                  data.rows.map((row) => (
                    <tr className="border-t" key={row.leader.id}>
                      <Td className="font-semibold">#{row.rank}</Td>
                      <Td className="font-medium">{row.leader.realName}</Td>
                      <Td>{row.leader.nickname || "-"}</Td>
                      <Td>{maskPhone(row.leader.phone)}</Td>
                      <Td>{LEADER_STATUS_LABELS[row.leader.status]}</Td>
                      <Td>{formatLeaderDisplayLevel(row.leader.status, row.leader.level)}</Td>
                      <Td>{row.leader.residentLocation || row.leader.region || "-"}</Td>
                      <Td className="font-semibold">{formatRankingPoints(row.totalPoints)}</Td>
                      <Td>{formatRankingPoints(row.baseTripPoints, { signed: true })}</Td>
                      <Td>{formatRankingPoints(row.applicationPoints, { signed: true })}</Td>
                      <Td>{formatRankingPoints(row.holidayPoints, { signed: true })}</Td>
                      <Td>{formatRankingPoints(row.otherAddPoints, { signed: true })}</Td>
                      <Td>{formatRankingPoints(row.deductPoints, { signed: true })}</Td>
                      <Td>{row.effectiveRecordCount}</Td>
                      <Td>{row.tripCount}</Td>
                      <Td>{formatRankingPoints(row.tripDays)}</Td>
                      <Td>
                        <Badge variant={row.bonusEligible ? "secondary" : "outline"}>
                          {row.bonusEligible ? "已满足" : "未满足"} {row.tripCount}/8 次
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex min-w-[180px] flex-col gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/score-records?leaderId=${row.leader.id}&scoreYearId=${data.scoreYear.id}`}>
                              查看积分明细
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/leaders/${row.leader.id}`}>查看队长档案</Link>
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={18}>
                      暂无积分记录。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
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

function normalizeLeaderStatus(value: string): LeaderStatus | undefined {
  return LEADER_STATUS_OPTIONS.includes(value as LeaderStatus)
    ? (value as LeaderStatus)
    : undefined;
}

function normalizeBonusEligible(value: string): "true" | "false" | undefined {
  return value === "true" || value === "false" ? value : undefined;
}

function normalizeLimit(value: string): 50 | 100 | "all" {
  if (value === "100") return 100;
  if (value === "all") return "all";
  return 50;
}

function maskPhone(phone: string | null) {
  return phone ? `****${phone.slice(-4)}` : "-";
}
