import Link from "next/link";
import type { ScoreApplicationStatus, ScoreApplicationType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/permissions";
import { SCORE_RECORD_READ_ROLES, LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import {
  SCORE_APPLICATION_CONFIGS,
  SCORE_APPLICATION_STATUS_LABELS,
  SCORE_APPLICATION_STATUS_OPTIONS,
  SCORE_APPLICATION_TYPE_OPTIONS,
  getApplicationTypeLabel,
  isSupportedApplicationType,
} from "@/lib/constants/score-applications";
import { prisma } from "@/lib/db/prisma";
import { getAdminScoreApplications } from "@/lib/services/score-applications";
import { ApplicationReviewActions } from "@/app/admin/score-applications/ApplicationReviewActions";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminScoreApplicationsPage({ searchParams }: PageProps) {
  const user = await requireRole(SCORE_RECORD_READ_ROLES, "/admin/score-applications");
  const canReview = LEADER_MANAGEMENT_ROLES.includes(user.role);
  const params = await searchParams;
  const activeScoreYear = await prisma.scoreYear.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    select: { id: true },
  });
  const filters = {
    keyword: getParam(params.keyword),
    type: normalizeType(getParam(params.type)),
    status: normalizeStatus(getParam(params.status)),
    scoreYearId: getParam(params.scoreYearId) || activeScoreYear?.id || "",
    leaderId: getParam(params.leaderId),
    startDate: parseDateParam(getParam(params.startDate), false),
    endDate: parseDateParam(getParam(params.endDate), true),
    page: Math.max(Number(getParam(params.page) || "1"), 1),
    pageSize: Math.max(Number(getParam(params.pageSize) || "20"), 1),
  };
  const [data, scoreYears, leaders] = await Promise.all([
    getAdminScoreApplications(filters),
    prisma.scoreYear.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.leader.findMany({
      orderBy: { realName: "asc" },
      select: { id: true, realName: true, nickname: true, phone: true },
    }),
  ]);

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">积分申请审核</h2>
        <p className="text-sm text-muted-foreground">
          查看队长提交的朋友圈、小红书和复购加分申请。
        </p>
      </div>

      <form className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            defaultValue={filters.keyword}
            name="keyword"
            placeholder="队长 / 手机号 / 标题 / 证明 / 路线"
          />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.type || ""} name="type">
            <option value="">全部类型</option>
            {SCORE_APPLICATION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_APPLICATION_CONFIGS[option].label}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={filters.status || ""} name="status">
            <option value="">全部状态</option>
            {SCORE_APPLICATION_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SCORE_APPLICATION_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
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
          <Input defaultValue={getParam(params.startDate)} name="startDate" type="date" />
          <Input defaultValue={getParam(params.endDate)} name="endDate" type="date" />
          <Button type="submit">筛选</Button>
        </div>
      </form>

      <section className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="min-w-[1400px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <Th>提交时间</Th>
              <Th>队长</Th>
              <Th>昵称</Th>
              <Th>手机号</Th>
              <Th>申请类型</Th>
              <Th>申请标题</Th>
              <Th>关联团期</Th>
              <Th>申请分值</Th>
              <Th>状态</Th>
              <Th>审核人</Th>
              <Th>审核时间</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {data.applications.length > 0 ? (
              data.applications.map((application) => (
                <tr className="border-t" key={application.id}>
                  <Td>{formatDateTime(application.submittedAt)}</Td>
                  <Td className="font-medium">{application.leader.realName}</Td>
                  <Td>{application.leader.nickname || "-"}</Td>
                  <Td>{application.leader.phone ? `****${application.leader.phone.slice(-4)}` : "-"}</Td>
                  <Td>{getApplicationTypeLabel(application.type)}</Td>
                  <Td>{application.title || "-"}</Td>
                  <Td>{application.trip?.routeName || "未关联团期"}</Td>
                  <Td>+{formatPoints(application.requestedPoints)}</Td>
                  <Td>
                    <Badge variant={application.status === "PENDING" ? "secondary" : "outline"}>
                      {SCORE_APPLICATION_STATUS_LABELS[application.status]}
                    </Badge>
                  </Td>
                  <Td>{application.reviewedBy || "-"}</Td>
                  <Td>{formatDateTime(application.reviewedAt)}</Td>
                  <Td>
                    <div className="flex min-w-[260px] flex-col gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/score-applications/${application.id}`}>查看</Link>
                      </Button>
                      {canReview && application.status === "PENDING" ? (
                        <ApplicationReviewActions applicationId={application.id} />
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={12}>
                  暂无积分申请。
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className || ""}`}>{children}</td>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function normalizeType(value: string): ScoreApplicationType | undefined {
  return isSupportedApplicationType(value) ? value : undefined;
}

function normalizeStatus(value: string): ScoreApplicationStatus | undefined {
  return SCORE_APPLICATION_STATUS_OPTIONS.includes(value as ScoreApplicationStatus)
    ? (value as ScoreApplicationStatus)
    : undefined;
}

function parseDateParam(value: string, endOfDay: boolean) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}+08:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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
  return `/admin/score-applications?${searchParams.toString()}`;
}
