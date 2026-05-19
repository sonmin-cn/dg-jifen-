import Link from "next/link";
import type { ScoreCategory, ScoreDirection } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RULE_MANAGEMENT_ROLES, SCORE_RULE_READ_ROLES } from "@/lib/auth/roles";
import {
  SCORE_CATEGORY_LABELS,
  SCORE_CATEGORY_OPTIONS,
  SCORE_DIRECTION_LABELS,
  SCORE_DIRECTION_OPTIONS,
} from "@/lib/constants/scores";
import { getAdminScoreRules } from "@/lib/services/score-rules";
import { ScoreRuleStatusButton } from "@/app/admin/score-rules/ScoreRuleStatusButton";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminScoreRulesPage({ searchParams }: PageProps) {
  const user = await requireRole(SCORE_RULE_READ_ROLES, "/admin/score-rules");
  const canManage = SCORE_RULE_MANAGEMENT_ROLES.includes(user.role);
  const params = await searchParams;
  const filters = {
    keyword: getParam(params.keyword),
    category: normalizeCategory(getParam(params.category)),
    direction: normalizeDirection(getParam(params.direction)),
    isActive: normalizeActive(getParam(params.isActive)),
  };
  const rules = await getAdminScoreRules(filters);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">积分规则管理</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              维护加分、扣分和专项积分规则。历史积分已保存规则快照，规则修改不会自动改变历史积分。
            </p>
          </div>
          {canManage ? (
            <Button asChild>
              <Link href="/admin/score-rules/new">新增积分规则</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <Input defaultValue={filters.keyword} name="keyword" placeholder="code / 名称 / 描述" />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.category || ""} name="category">
            <option value="">全部分类</option>
            {SCORE_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.direction || ""} name="direction">
            <option value="">全部方向</option>
            {SCORE_DIRECTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_DIRECTION_LABELS[option]}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.isActive || ""} name="isActive">
            <option value="">全部状态</option>
            <option value="true">启用</option>
            <option value="false">停用</option>
          </select>
          <Button type="submit">筛选</Button>
        </div>
      </form>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1500px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>code</Th>
              <Th>名称</Th>
              <Th>版本</Th>
              <Th>分类</Th>
              <Th>方向</Th>
              <Th>分值</Th>
              <Th>reviewType</Th>
              <Th>triggerType</Th>
              <Th>状态</Th>
              <Th>生效时间</Th>
              <Th>失效时间</Th>
              <Th>说明</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {rules.length > 0 ? (
              rules.map((rule) => (
                <tr className="border-t" key={rule.id}>
                  <Td className="font-mono">{rule.code}</Td>
                  <Td className="font-medium">{rule.name}</Td>
                  <Td>v{rule.version}</Td>
                  <Td>{SCORE_CATEGORY_LABELS[rule.category]}</Td>
                  <Td>{SCORE_DIRECTION_LABELS[rule.direction]}</Td>
                  <Td>{formatPoints(rule.points)}</Td>
                  <Td>{rule.reviewType}</Td>
                  <Td>{rule.triggerType}</Td>
                  <Td>
                    <Badge variant={rule.isActive ? "secondary" : "outline"}>
                      {rule.isActive ? "启用" : "停用"}
                    </Badge>
                  </Td>
                  <Td>{formatDateTime(rule.effectiveFrom)}</Td>
                  <Td>{formatDateTime(rule.effectiveTo)}</Td>
                  <Td className="max-w-[240px]">{rule.description || "-"}</Td>
                  <Td>
                    <div className="flex min-w-[150px] flex-col gap-2">
                      {canManage ? (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/score-rules/${rule.id}/edit`}>编辑</Link>
                          </Button>
                          <ScoreRuleStatusButton ruleId={rule.id} isActive={rule.isActive} />
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
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={13}>
                  暂无积分规则。
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

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className || ""}`}>{children}</td>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function normalizeCategory(value: string): ScoreCategory | undefined {
  return SCORE_CATEGORY_OPTIONS.includes(value as ScoreCategory) ? (value as ScoreCategory) : undefined;
}

function normalizeDirection(value: string): ScoreDirection | undefined {
  return value === "ADD" || value === "DEDUCT" ? value : undefined;
}

function normalizeActive(value: string): "true" | "false" | undefined {
  return value === "true" || value === "false" ? value : undefined;
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
