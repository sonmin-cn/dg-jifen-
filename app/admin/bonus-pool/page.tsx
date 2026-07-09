import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import { BONUS_MANAGEMENT_ROLES, BONUS_READ_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { formatMoney, getBonusPoolSummary } from "@/lib/services/bonus";
import { BonusPoolForm } from "@/app/admin/bonus-pool/BonusPoolForm";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BonusPoolPage({ searchParams }: PageProps) {
  const user = await requireRole(BONUS_READ_ROLES, "/admin/bonus-pool");
  const canManage = BONUS_MANAGEMENT_ROLES.includes(user.role);
  const params = await searchParams;
  const scoreYears = await prisma.scoreYear.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, status: true },
  });
  const activeScoreYear = scoreYears.find((scoreYear) => scoreYear.status === "ACTIVE");
  const selectedScoreYearId = getParam(params.scoreYearId) || activeScoreYear?.id || scoreYears[0]?.id || "";
  const summary = selectedScoreYearId
    ? await getBonusPoolSummary(selectedScoreYearId)
    : { totalAmount: 0, entryCount: 0, latestInjectedAt: null, entries: [] };

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">奖金池管理</h2>
        <p className="text-sm text-muted-foreground">
          录入并查看按积分年度累计的队长年终奖金池。
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
          <Button type="submit">切换年度</Button>
        </div>
      </form>

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <StatCard label="奖金池累计金额" value={formatMoney(summary.totalAmount)} />
        <StatCard label="注入次数" value={String(summary.entryCount)} />
        <StatCard label="最近注入时间" value={formatDateTime(summary.latestInjectedAt)} />
        <StatCard label="当前年度" value={scoreYears.find((row) => row.id === selectedScoreYearId)?.name || "-"} />
      </section>

      {canManage && selectedScoreYearId ? (
        <section className="mb-5">
          <BonusPoolForm scoreYearId={selectedScoreYearId} />
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>注入时间</Th>
              <Th>标题</Th>
              <Th>金额</Th>
              <Th>来源类型</Th>
              <Th>说明</Th>
              <Th>创建人</Th>
              <Th>创建时间</Th>
            </tr>
          </thead>
          <tbody>
            {summary.entries.length > 0 ? (
              summary.entries.map((entry) => (
                <tr className="border-t" key={entry.id}>
                  <Td>{formatDateTime(entry.injectedAt)}</Td>
                  <Td className="font-medium">{entry.title}</Td>
                  <Td>{formatMoney(entry.amount)}</Td>
                  <Td>{entry.sourceType || "-"}</Td>
                  <Td>{entry.description || "-"}</Td>
                  <Td>{entry.createdBy || "-"}</Td>
                  <Td>{formatDateTime(entry.createdAt)}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={7}>
                  暂无奖金池注入记录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="mt-5">
        <Button variant="outline" asChild>
          <Link href={`/admin/bonus-settlement?scoreYearId=${selectedScoreYearId}`}>进入奖金测算</Link>
        </Button>
      </div>
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
  return formatDateTimeCN(value);
}
