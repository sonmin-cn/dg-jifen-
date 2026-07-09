import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import { BONUS_READ_ROLES } from "@/lib/auth/roles";
import { LEADER_STATUS_LABELS, formatLeaderDisplayLevel } from "@/lib/constants/leaders";
import {
  formatMoney,
  formatPercent,
  formatRankingPoints,
  getBonusSettlementDetail,
} from "@/lib/services/bonus";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BonusSettlementDetailPage({ params }: PageProps) {
  await requireRole(BONUS_READ_ROLES, "/admin/bonus-settlement/:id");
  const { id } = await params;
  const settlement = await getBonusSettlementDetail(id);

  if (!settlement) {
    notFound();
  }

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href={`/admin/bonus-settlement?scoreYearId=${settlement.scoreYearId}`}>返回奖金测算</Link>
      </Button>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">{settlement.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {settlement.scoreYear.name} · {formatDateTime(settlement.createdAt)}
        </p>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Info label="奖金池总额" value={formatMoney(settlement.totalPoolAmount)} />
        <Info label="符合资格人数" value={String(settlement.eligibleLeaderCount)} />
        <Info label="奖金测算积分" value={formatRankingPoints(settlement.totalEligiblePoints)} />
        <Info label="理论奖金合计" value={formatMoney(settlement.totalCalculatedAmount)} />
        <Info label="实际分配金额" value={formatMoney(settlement.totalFinalAmount)} />
        <Info label="封顶扣减" value={formatMoney(settlement.totalCappedAmount)} />
        <Info label="未分配余额" value={formatMoney(settlement.undistributedAmount)} />
        <Info label="状态" value={settlement.status} />
        <Info label="备注" value={settlement.remark} wide />
      </section>

      <p className="mb-3 text-sm text-muted-foreground">
        历史测算详情按当前数据库已保存字段展示；本次测算使用的规则快照会写入备注，新的预览页会展示档位、权重和加权积分。
      </p>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1500px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>排名</Th>
              <Th>队长</Th>
              <Th>昵称</Th>
              <Th>状态</Th>
              <Th>等级</Th>
              <Th>总积分</Th>
              <Th>基础带队</Th>
              <Th>申请加分</Th>
              <Th>扣分</Th>
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
            {settlement.items.map((item) => (
              <tr className="border-t" key={item.id}>
                <Td>#{item.rank}</Td>
                <Td className="font-medium">{item.leader.realName}</Td>
                <Td>{item.leader.nickname || "-"}</Td>
                <Td>{LEADER_STATUS_LABELS[item.leader.status]}</Td>
                <Td>{formatLeaderDisplayLevel(item.leader.status, item.leader.level)}</Td>
                <Td>{formatRankingPoints(item.totalPoints)}</Td>
                <Td>{formatRankingPoints(item.baseTripPoints || 0, { signed: true })}</Td>
                <Td>{formatRankingPoints(item.applicationPoints || 0, { signed: true })}</Td>
                <Td>{formatRankingPoints(item.deductPoints || 0, { signed: true })}</Td>
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
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-4 shadow-sm ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold">{value || "-"}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className || ""}`}>{children}</td>;
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return formatDateTimeCN(value);
}
