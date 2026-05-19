import { redirect } from "next/navigation";
import type { ScoreCategory, ScoreDirection } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { requireRole } from "@/lib/auth/permissions";
import {
  SCORE_CATEGORY_LABELS,
  SCORE_CATEGORY_OPTIONS,
  SCORE_DIRECTION_LABELS,
  SCORE_DIRECTION_OPTIONS,
  SCORE_RECORD_STATUS_LABELS,
} from "@/lib/constants/scores";
import { getLeaderScoreRecords } from "@/lib/services/leader-scores";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeaderScoresPage({ searchParams }: PageProps) {
  const user = await requireRole(["LEADER"], "/leader/scores");
  const params = await searchParams;
  const category = normalizeCategory(getParam(params.category));
  const direction = normalizeDirection(getParam(params.direction));
  const scoreYearId = getParam(params.scoreYearId);
  const data = await getLeaderScoreRecords(user.id, {
    category,
    direction,
    scoreYearId: scoreYearId || undefined,
  });

  if (!data.leader) {
    redirect("/leader/bind");
  }

  return (
    <div className="mt-6 space-y-5 md:mt-8">
      <BackButton fallbackHref="/leader/dashboard" />
      <div>
        <h2 className="text-2xl font-semibold md:text-3xl">积分明细</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          当前页面只展示与你的绑定队长档案关联的积分记录。
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-4">
        <select
          className="h-11 w-full rounded-md border bg-background px-3 text-base md:text-sm"
          defaultValue={data.selectedScoreYearId}
          name="scoreYearId"
        >
          {data.scoreYears.length > 0 ? (
            data.scoreYears.map((scoreYear) => (
              <option key={scoreYear.id} value={scoreYear.id}>
                {scoreYear.name}
                {scoreYear.status === "ACTIVE" ? "（当前）" : ""}
              </option>
            ))
          ) : (
            <option value="">暂无积分年度</option>
          )}
        </select>
        <select
          className="h-11 w-full rounded-md border bg-background px-3 text-base md:text-sm"
          defaultValue={category || ""}
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
          className="h-11 w-full rounded-md border bg-background px-3 text-base md:text-sm"
          defaultValue={direction || ""}
          name="direction"
        >
          <option value="">全部方向</option>
          {SCORE_DIRECTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SCORE_DIRECTION_LABELS[option]}
            </option>
          ))}
        </select>
        <Button className="h-11 w-full" type="submit">筛选</Button>
      </form>

      <section className="hidden overflow-x-auto rounded-lg border bg-card shadow-sm md:block">
        <table className="min-w-[1180px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>日期</Th>
              <Th>积分项目</Th>
              <Th>分类</Th>
              <Th>加分/扣分</Th>
              <Th>分值</Th>
              <Th>关联团期</Th>
              <Th>状态</Th>
              <Th>备注</Th>
              <Th>规则名称</Th>
              <Th>规则编码</Th>
            </tr>
          </thead>
          <tbody>
            {data.records.length > 0 ? (
              data.records.map((record) => (
                <tr className="border-t" key={record.id}>
                  <Td>{formatDate(record.occurredAt)}</Td>
                  <Td className="font-medium">{record.item}</Td>
                  <Td>{SCORE_CATEGORY_LABELS[record.category]}</Td>
                  <Td>
                    <Badge variant={record.direction === "ADD" ? "secondary" : "outline"}>
                      {SCORE_DIRECTION_LABELS[record.direction]}
                    </Badge>
                  </Td>
                  <Td className="font-semibold">{formatSignedPoints(record.effectivePoints)}</Td>
                  <Td>{record.trip?.routeName || "未关联团期"}</Td>
                  <Td>{SCORE_RECORD_STATUS_LABELS[record.status]}</Td>
                  <Td className="max-w-[260px] whitespace-normal">
                    {record.remark || "-"}
                  </Td>
                  <Td>{record.ruleName || "-"}</Td>
                  <Td>{record.ruleCode || "-"}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={10}>
                  暂无积分记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="grid gap-3 md:hidden">
        {data.records.length > 0 ? (
          data.records.map((record) => (
            <article className="rounded-lg border bg-card p-4 shadow-sm" key={record.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{record.item}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(record.occurredAt)}
                  </p>
                </div>
                <p className="text-xl font-semibold">{formatSignedPoints(record.effectivePoints)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">{SCORE_CATEGORY_LABELS[record.category]}</Badge>
                <Badge variant={record.direction === "ADD" ? "secondary" : "outline"}>
                  {SCORE_DIRECTION_LABELS[record.direction]}
                </Badge>
                <Badge variant="outline">{SCORE_RECORD_STATUS_LABELS[record.status]}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <InfoLine label="关联团期" value={record.trip?.routeName || "未关联团期"} />
                <InfoLine label="规则名称" value={record.ruleName} />
                <InfoLine label="备注" value={record.remark} />
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无积分记录
          </p>
        )}
      </section>
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

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="text-muted-foreground">
      {label}：<span className="break-words text-foreground">{value || "-"}</span>
    </p>
  );
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

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatSignedPoints(value: number) {
  if (value === 0) {
    return "0";
  }

  return `${value > 0 ? "+" : "-"}${formatPoints(Math.abs(value))}`;
}
