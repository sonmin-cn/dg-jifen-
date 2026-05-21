import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/permissions";
import {
  SCORE_YEAR_MANAGEMENT_ROLES,
  SCORE_YEAR_READ_ROLES,
} from "@/lib/auth/roles";
import {
  SCORE_YEAR_STATUS_LABELS,
  formatScoreYearDate,
} from "@/lib/constants/score-years";
import { getAdminScoreYears } from "@/lib/services/score-years";
import { ScoreYearActionButtons } from "@/app/admin/score-years/ScoreYearActionButtons";

export default async function AdminScoreYearsPage() {
  const user = await requireRole(SCORE_YEAR_READ_ROLES, "/admin/score-years");
  const canManage = SCORE_YEAR_MANAGEMENT_ROLES.includes(user.role);
  const scoreYears = await getAdminScoreYears();

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">积分年度管理</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            积分年度用于判断积分归属、排行榜统计和奖金测算。生成基础带队积分时，
            系统会根据团期结束日期匹配覆盖该日期的 ACTIVE 积分年度。
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/admin/score-years/new">新增积分年度</Link>
          </Button>
        ) : null}
      </div>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1180px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>年度名称</Th>
              <Th>开始日期</Th>
              <Th>结束日期</Th>
              <Th>状态</Th>
              <Th>可用于生成积分</Th>
              <Th>积分记录数</Th>
              <Th>奖金池金额</Th>
              <Th>创建 / 更新</Th>
              <Th>说明</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {scoreYears.length > 0 ? (
              scoreYears.map((scoreYear) => (
                <tr className="border-t" key={scoreYear.id}>
                  <Td className="font-medium">{scoreYear.name}</Td>
                  <Td>{formatScoreYearDate(scoreYear.startDate)}</Td>
                  <Td>{formatScoreYearDate(scoreYear.endDate)}</Td>
                  <Td>
                    <Badge variant={scoreYear.status === "ACTIVE" ? "secondary" : "outline"}>
                      {SCORE_YEAR_STATUS_LABELS[scoreYear.status]}（{scoreYear.status}）
                    </Badge>
                  </Td>
                  <Td>{scoreYear.status === "ACTIVE" ? "可用" : "不可用"}</Td>
                  <Td>{scoreYear.scoreRecordCount}</Td>
                  <Td>¥{scoreYear.bonusPoolAmount.toFixed(2)}</Td>
                  <Td>
                    <div>{formatDateTime(scoreYear.createdAt)}</div>
                    <div className="text-muted-foreground">{formatDateTime(scoreYear.updatedAt)}</div>
                  </Td>
                  <Td className="max-w-[220px]">{scoreYear.remark || "-"}</Td>
                  <Td>
                    <div className="flex min-w-[160px] flex-col gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/score-records?scoreYearId=${scoreYear.id}`}>
                          查看积分记录
                        </Link>
                      </Button>
                      {canManage ? (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/score-years/${scoreYear.id}/edit`}>编辑</Link>
                          </Button>
                          <ScoreYearActionButtons
                            scoreYearId={scoreYear.id}
                            status={scoreYear.status}
                          />
                        </>
                      ) : (
                        <span className="text-muted-foreground">只读</span>
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={10}>
                  暂无积分年度。请先新增一个覆盖当前试运营日期范围的 ACTIVE 积分年度。
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
}
