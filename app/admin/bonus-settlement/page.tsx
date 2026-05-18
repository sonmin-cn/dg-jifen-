import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { BONUS_MANAGEMENT_ROLES, BONUS_READ_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import {
  calculateBonusSettlement,
  formatMoney,
  formatPercent,
  formatRankingPoints,
  getBonusSettlements,
} from "@/lib/services/bonus";
import { BonusSettlementSaveForm } from "@/app/admin/bonus-settlement/BonusSettlementSaveForm";
import { LEADER_STATUS_LABELS } from "@/lib/constants/leaders";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BonusSettlementPage({ searchParams }: PageProps) {
  const user = await requireRole(BONUS_READ_ROLES, "/admin/bonus-settlement");
  const canManage = BONUS_MANAGEMENT_ROLES.includes(user.role);
  const params = await searchParams;
  const scoreYears = await prisma.scoreYear.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, status: true },
  });
  const activeScoreYear = scoreYears.find((scoreYear) => scoreYear.status === "ACTIVE");
  const selectedScoreYearId = getParam(params.scoreYearId) || activeScoreYear?.id || scoreYears[0]?.id || "";
  const [settlements, previewResult] = await Promise.all([
    getBonusSettlements(selectedScoreYearId),
    selectedScoreYearId
      ? calculateBonusSettlement(selectedScoreYearId)
      : Promise.resolve({ ok: false as const, status: 404, message: "暂无积分年度" }),
  ]);
  const preview = previewResult.ok ? previewResult.preview : null;

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">年终奖金测算</h2>
        <p className="text-sm text-muted-foreground">
          奖金测算仅作为试运行参考，不代表最终发放结果。最终奖金以公司年终公告和财务审核为准。
        </p>
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={selectedScoreYearId} name="scoreYearId">
            {scoreYears.length > 0 ? null : <option value="">暂无积分年度</option>}
            {scoreYears.map((scoreYear) => (
              <option key={scoreYear.id} value={scoreYear.id}>
                {scoreYear.name}
                {scoreYear.status === "ACTIVE" ? "（当前）" : ""}
              </option>
            ))}
          </select>
          <Button type="submit">生成测算预览</Button>
        </div>
      </form>

      {!preview ? (
        <section className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {previewResult.ok ? "暂无测算数据。" : previewResult.message}
        </section>
      ) : (
        <>
          {preview.totalPoolAmount <= 0 ? (
            <p className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              当前年度奖金池为 0，无法生成有效测算。
            </p>
          ) : null}
          {preview.eligibleLeaderCount <= 0 ? (
            <p className="mb-5 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              暂无符合资格的队长，无法测算奖金。
            </p>
          ) : null}

          <section className="mb-5 grid gap-4 md:grid-cols-4 xl:grid-cols-7">
            <StatCard label="奖金池总额" value={formatMoney(preview.totalPoolAmount)} />
            <StatCard label="符合资格人数" value={String(preview.eligibleLeaderCount)} />
            <StatCard label="总有效积分" value={formatRankingPoints(preview.totalEffectivePoints)} />
            <StatCard label="资格队长积分" value={formatRankingPoints(preview.totalEligiblePoints)} />
            <StatCard label="实际分配金额" value={formatMoney(preview.totalFinalAmount)} />
            <StatCard label="封顶扣减" value={formatMoney(preview.totalCappedAmount)} />
            <StatCard label="未分配余额" value={formatMoney(preview.undistributedAmount)} />
          </section>

          {canManage ? (
            <section className="mb-5">
              <BonusSettlementSaveForm
                defaultTitle={`${preview.scoreYearName}队长积分奖金测算`}
                scoreYearId={preview.scoreYearId}
              />
            </section>
          ) : null}

          <section className="mb-5 overflow-x-auto rounded-lg border bg-card shadow-sm">
            <table className="min-w-[1680px] w-full border-collapse text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <Th>排名</Th>
                  <Th>队长</Th>
                  <Th>昵称</Th>
                  <Th>状态</Th>
                  <Th>等级</Th>
                  <Th>总有效积分</Th>
                  <Th>基础带队</Th>
                  <Th>申请加分</Th>
                  <Th>扣分合计</Th>
                  <Th>带队次数</Th>
                  <Th>带队天数</Th>
                  <Th>资格</Th>
                  <Th>不符合原因</Th>
                  <Th>积分占比</Th>
                  <Th>理论奖金</Th>
                  <Th>封顶扣减</Th>
                  <Th>最终奖金</Th>
                </tr>
              </thead>
              <tbody>
                {preview.items.length > 0 ? (
                  preview.items.map((item) => (
                    <tr className="border-t" key={item.leaderId}>
                      <Td>#{item.rank}</Td>
                      <Td className="font-medium">{item.leaderName}</Td>
                      <Td>{item.nickname || "-"}</Td>
                      <Td>{LEADER_STATUS_LABELS[item.leaderStatus as keyof typeof LEADER_STATUS_LABELS]}</Td>
                      <Td>{item.level || "-"}</Td>
                      <Td>{formatRankingPoints(item.totalPoints)}</Td>
                      <Td>{formatRankingPoints(item.baseTripPoints, { signed: true })}</Td>
                      <Td>{formatRankingPoints(item.applicationPoints, { signed: true })}</Td>
                      <Td>{formatRankingPoints(item.deductPoints, { signed: true })}</Td>
                      <Td>{item.tripCount}</Td>
                      <Td>{formatRankingPoints(item.tripDays)}</Td>
                      <Td>
                        <Badge variant={item.eligible ? "secondary" : "outline"}>
                          {item.eligible ? "符合" : "不符合"}
                        </Badge>
                      </Td>
                      <Td>{item.ineligibleReason || "-"}</Td>
                      <Td>{formatPercent(item.pointShare)}</Td>
                      <Td>{formatMoney(item.calculatedAmount)}</Td>
                      <Td>{formatMoney(item.cappedAmount)}</Td>
                      <Td className="font-semibold">{formatMoney(item.finalAmount)}</Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={17}>
                      暂无测算明细。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold">历史测算</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <Th>创建时间</Th>
                <Th>标题</Th>
                <Th>奖金池</Th>
                <Th>符合人数</Th>
                <Th>实际分配</Th>
                <Th>未分配余额</Th>
                <Th>状态</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {settlements.length > 0 ? (
                settlements.map((settlement) => (
                  <tr className="border-t" key={settlement.id}>
                    <Td>{formatDateTime(settlement.createdAt)}</Td>
                    <Td className="font-medium">{settlement.title}</Td>
                    <Td>{formatMoney(settlement.totalPoolAmount)}</Td>
                    <Td>{settlement.eligibleLeaderCount}</Td>
                    <Td>{formatMoney(settlement.totalFinalAmount)}</Td>
                    <Td>{formatMoney(settlement.undistributedAmount)}</Td>
                    <Td>{settlement.status}</Td>
                    <Td>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/bonus-settlement/${settlement.id}`}>查看详情</Link>
                      </Button>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-muted-foreground" colSpan={8}>
                    暂无历史测算。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </article>
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

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toISOString().slice(0, 19).replace("T", " ");
}
