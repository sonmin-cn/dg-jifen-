import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getBonusPoolSummary } from "@/lib/services/bonus";
import {
  getAdminScoreRanking,
  getScoreYearDateRange,
} from "@/lib/services/score-ranking";
import { getApplicationTypeLabel } from "@/lib/constants/score-applications";
import { formatLeaderDisplayLevel } from "@/lib/constants/leaders";

export type DataCheckCode =
  | "SCORE_YEAR_ANOMALIES"
  | "V22_RULE_ANOMALIES"
  | "UNBOUND_LEADERS"
  | "PENDING_BIND_REQUESTS"
  | "COMPLETED_TRIPS_WITHOUT_BASE_SCORE"
  | "COMPLETED_TRIPS_WITH_INCOMPLETE_LEADERS"
  | "STALE_SCORE_APPLICATIONS"
  | "SCORE_RECORD_ANOMALIES"
  | "BONUS_SETTLEMENT_RISKS";

export const DATA_CHECK_GROUPS: Array<{
  code: DataCheckCode;
  title: string;
  description: string;
  suggestion: string;
}> = [
  {
    code: "SCORE_YEAR_ANOMALIES",
    title: "积分年度异常",
    description: "积分年度缺失、多个 ACTIVE、日期重叠或已完成团期无法匹配 ACTIVE 年度。",
    suggestion: "进入积分年度管理，新增、启用或调整覆盖团期结束日期的积分年度。",
  },
  {
    code: "V22_RULE_ANOMALIES",
    title: "V2.2 规则异常",
    description: "传播上限、每团重复、复购归属、推荐上限和资格取消事件的核对结果。",
    suggestion: "请根据 V2.2 规则核对，必要时通过积分作废、重新审核或专项补录处理。",
  },
  {
    code: "UNBOUND_LEADERS",
    title: "队长账号绑定异常",
    description: "该队长尚未绑定登录账号，队长端无法查看积分。",
    suggestion: "通知队长注册账号并提交绑定申请，或检查手机号是否一致。",
  },
  {
    code: "PENDING_BIND_REQUESTS",
    title: "待审核绑定申请",
    description: "存在待审核的队长账号绑定申请。",
    suggestion: "请队长主管及时审核绑定申请。",
  },
  {
    code: "COMPLETED_TRIPS_WITHOUT_BASE_SCORE",
    title: "已完成团期未生成基础积分",
    description: "该带队记录已完成，但尚未生成基础带队积分。",
    suggestion: "进入团期详情页点击生成基础积分。",
  },
  {
    code: "COMPLETED_TRIPS_WITH_INCOMPLETE_LEADERS",
    title: "完成团期存在未完成带队记录",
    description: "团期已完成，但部分带队记录未标记完成，可能影响基础积分生成。",
    suggestion: "核实该队长是否实际带队，如已带队请补充完成状态和实际带队天数。",
  },
  {
    code: "STALE_SCORE_APPLICATIONS",
    title: "长期待审核积分申请",
    description: "该积分申请已待审核超过 3 天。",
    suggestion: "请尽快审核，避免队长积分长期不同步。",
  },
  {
    code: "SCORE_RECORD_ANOMALIES",
    title: "积分记录异常",
    description: "该积分记录存在方向、分值或规则快照异常。",
    suggestion: "请进入积分详情核对，必要时作废并重新生成。",
  },
  {
    code: "BONUS_SETTLEMENT_RISKS",
    title: "奖金测算前风险",
    description: "该数据可能影响奖金测算准确性或资格判断。",
    suggestion: "请在奖金测算前完成核对。",
  },
];

export type DataCheckParams = {
  scoreYearId?: string;
  checkType?: DataCheckCode | "";
  keyword?: string;
  onlyIssues?: boolean;
};

export type DataCheckIssue = {
  id: string;
  code: DataCheckCode;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  target: string;
  description: string;
  suggestion: string;
  href: string;
  actionLabel: string;
  fields: Array<{ label: string; value: string }>;
  searchText: string;
};

export type DataCheckGroup = {
  code: DataCheckCode;
  title: string;
  description: string;
  suggestion: string;
  total: number;
  items: DataCheckIssue[];
};

export async function getDataCheckDashboard(params: DataCheckParams) {
  const [selectedScoreYear, scoreYears] = await Promise.all([
    params.scoreYearId
      ? prisma.scoreYear.findUnique({ where: { id: params.scoreYearId } })
      : prisma.scoreYear.findFirst({
          where: { status: "ACTIVE" },
          orderBy: { startDate: "desc" },
        }),
    prisma.scoreYear.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, status: true, startDate: true, endDate: true },
    }),
  ]);

  if (!selectedScoreYear) {
    const groups = await buildIssueGroups({
      scoreYearId: "",
      checkType: params.checkType,
      keyword: normalizeKeyword(params.keyword),
    });
    return {
      scoreYear: null,
      scoreYears,
      summary: emptySystemSummary(),
      overview: emptyOverview(),
      checkGroups: groups,
    };
  }

  const [summary, groups] = await Promise.all([
    getSystemSummary(selectedScoreYear.id),
    buildIssueGroups({
      scoreYearId: selectedScoreYear.id,
      checkType: params.checkType,
      keyword: normalizeKeyword(params.keyword),
    }),
  ]);

  const groupByCode = new Map(groups.map((group) => [group.code, group]));

  return {
    scoreYear: selectedScoreYear,
    scoreYears,
    summary,
    overview: {
      bindingRate:
        summary.leaderTotal > 0
          ? Math.round((summary.boundLeaderCount / summary.leaderTotal) * 10000) / 100
          : 0,
      pendingApplicationCount: summary.pendingScoreApplicationCount,
      missingBaseScoreCount: summary.missingBaseScoreCount,
      scoreRecordAnomalyCount: groupByCode.get("SCORE_RECORD_ANOMALIES")?.total ?? 0,
      bonusRiskCount:
        (groupByCode.get("BONUS_SETTLEMENT_RISKS")?.total ?? 0) +
        (groupByCode.get("SCORE_YEAR_ANOMALIES")?.total ?? 0),
      bonusPoolAmount: summary.bonusPoolAmount,
    },
    checkGroups: groups,
  };
}

export async function getSystemSummary(scoreYearId: string) {
  const scoreYear = await prisma.scoreYear.findUnique({ where: { id: scoreYearId } });

  if (!scoreYear) return emptySystemSummary();

  const range = getScoreYearDateRange(scoreYear);
  const [
    leaderTotal,
    boundLeaderCount,
    unboundLeaderCount,
    effectiveScoreRecordCount,
    voidedScoreRecordCount,
    pendingScoreApplicationCount,
    completedTripCount,
    missingBaseScoreCount,
    bonusPoolSummary,
    ranking,
  ] = await Promise.all([
    prisma.leader.count(),
    prisma.leader.count({ where: { userId: { not: null } } }),
    prisma.leader.count({ where: { userId: null, status: { not: "LEFT" } } }),
    prisma.scoreRecord.count({ where: { scoreYearId, status: "EFFECTIVE" } }),
    prisma.scoreRecord.count({ where: { scoreYearId, status: "VOIDED" } }),
    prisma.scoreApplication.count({ where: { scoreYearId, status: "PENDING" } }),
    prisma.trip.count({
      where: {
        status: "COMPLETED",
        endDate: { gte: range.startDate, lte: range.endDate },
      },
    }),
    isBaseTripRuleActive(range.endDate).then((isActive) =>
      isActive
        ? prisma.tripLeader.count({
            where: {
              isCompleted: true,
              actualWorkDays: { gt: 0 },
              baseScoreRecordId: null,
              trip: {
                status: "COMPLETED",
                endDate: { gte: range.startDate, lte: range.endDate },
              },
            },
          })
        : 0,
    ),
    getBonusPoolSummary(scoreYearId),
    getAdminScoreRanking({ scoreYearId, limit: "all" }),
  ]);

  return {
    leaderTotal,
    boundLeaderCount,
    unboundLeaderCount,
    scoreYearName: scoreYear.name,
    effectiveScoreRecordCount,
    voidedScoreRecordCount,
    pendingScoreApplicationCount,
    completedTripCount,
    missingBaseScoreCount,
    bonusPoolAmount: bonusPoolSummary.totalAmount,
    bonusEligibleLeaderCount: ranking.allRows.filter((row) => row.bonusEligible).length,
    negativeLeaderCount: ranking.allRows.filter((row) => row.totalPoints < 0).length,
  };
}

export async function getUnboundLeaders(params: DataCheckParams) {
  const leaders = await prisma.leader.findMany({
    where: {
      userId: null,
      status: { not: "LEFT" },
      ...leaderKeywordWhere(params.keyword),
    },
    orderBy: [{ lastImportedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return leaders.map((leader) =>
    issue({
      code: "UNBOUND_LEADERS",
      severity: "MEDIUM",
      id: leader.id,
      title: "队长未绑定账号",
      target: leader.realName,
      href: `/admin/leaders/${leader.id}`,
      actionLabel: "查看队长档案",
      fields: [
        field("队长姓名", leader.realName),
        field("昵称", leader.nickname),
        field("手机号", maskPhone(leader.phone)),
        field("状态", leader.status),
        field("等级", formatLeaderDisplayLevel(leader.status, leader.level)),
        field("常驻地", leader.residentLocation || leader.region),
        field("最近导入时间", formatDateTime(leader.lastImportedAt)),
      ],
    }),
  );
}

export async function getPendingBindRequests(params: DataCheckParams) {
  const requests = await prisma.leaderBindRequest.findMany({
    where: {
      status: "PENDING",
      ...(params.keyword
        ? {
            OR: [
              { realNameInput: { contains: params.keyword } },
              { userPhone: { contains: params.keyword } },
              { leaderPhone: { contains: params.keyword } },
              { matchReason: { contains: params.keyword } },
              { leader: { realName: { contains: params.keyword } } },
              { leader: { nickname: { contains: params.keyword } } },
            ],
          }
        : {}),
    },
    include: {
      leader: { select: { id: true, realName: true, nickname: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return requests.map((request) =>
    issue({
      code: "PENDING_BIND_REQUESTS",
      severity: "MEDIUM",
      id: request.id,
      title: "绑定申请待审核",
      target: request.leader.realName,
      href: "/admin/leader-bind-requests",
      actionLabel: "前往审核",
      fields: [
        field("申请时间", formatDateTime(request.createdAt)),
        field("队长姓名", request.leader.realName),
        field("账号手机号", maskPhone(request.userPhone)),
        field("Leader 手机号", maskPhone(request.leaderPhone)),
        field("匹配原因", request.matchReason),
      ],
    }),
  );
}

export async function getCompletedTripsWithoutBaseScore(params: DataCheckParams) {
  const scoreYear = await getScoreYear(params.scoreYearId);
  if (!scoreYear) return [];
  const range = getScoreYearDateRange(scoreYear);
  const baseTripRuleActive = await isBaseTripRuleActive(range.endDate);
  if (!baseTripRuleActive) return [];
  const records = await prisma.tripLeader.findMany({
    where: {
      isCompleted: true,
      actualWorkDays: { gt: 0 },
      baseScoreRecordId: null,
      trip: {
        status: "COMPLETED",
        endDate: { gte: range.startDate, lte: range.endDate },
      },
      ...tripLeaderKeywordWhere(params.keyword),
    },
    include: tripLeaderInclude,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return records.map((record) =>
    issue({
      code: "COMPLETED_TRIPS_WITHOUT_BASE_SCORE",
      severity: "HIGH",
      id: record.id,
      title: "基础积分未生成",
      target: record.trip.routeName,
      href: `/admin/trips/${record.tripId}`,
      actionLabel: "前往团期详情",
      fields: [
        field("团期名称", record.trip.routeName),
        field("开始日期", formatDate(record.trip.startDate)),
        field("结束日期", formatDate(record.trip.endDate)),
        field("队长姓名", record.leader.realName),
        field("实际带队天数", formatNumber(record.actualWorkDays)),
      ],
    }),
  );
}

async function isBaseTripRuleActive(occurredAt: Date) {
  const rule = await prisma.scoreRule.findFirst({
    where: {
      code: "BASE_TRIP",
      isActive: true,
      effectiveFrom: { lte: occurredAt },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: occurredAt } }],
    },
    select: { id: true },
  });

  return Boolean(rule);
}

export async function getCompletedTripsWithIncompleteLeaders(params: DataCheckParams) {
  const scoreYear = await getScoreYear(params.scoreYearId);
  if (!scoreYear) return [];
  const range = getScoreYearDateRange(scoreYear);
  const records = await prisma.tripLeader.findMany({
    where: {
      isCompleted: false,
      trip: {
        status: "COMPLETED",
        endDate: { gte: range.startDate, lte: range.endDate },
      },
      ...tripLeaderKeywordWhere(params.keyword),
    },
    include: tripLeaderInclude,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return records.map((record) =>
    issue({
      code: "COMPLETED_TRIPS_WITH_INCOMPLETE_LEADERS",
      severity: "MEDIUM",
      id: record.id,
      title: "完成团期存在未完成带队记录",
      target: record.trip.routeName,
      href: `/admin/trips/${record.tripId}`,
      actionLabel: "前往团期详情",
      fields: [
        field("团期名称", record.trip.routeName),
        field("队长姓名", record.leader.realName),
        field("带队角色", record.role),
        field("实际带队天数", formatNumber(record.actualWorkDays)),
        field("完成状态", record.isCompleted ? "已完成" : "未完成"),
      ],
    }),
  );
}

export async function getStaleScoreApplications(params: DataCheckParams) {
  const staleBefore = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const applications = await prisma.scoreApplication.findMany({
    where: {
      scoreYearId: params.scoreYearId,
      status: "PENDING",
      submittedAt: { lt: staleBefore },
      ...(params.keyword
        ? {
            OR: [
              { title: { contains: params.keyword } },
              { evidenceText: { contains: params.keyword } },
              { leader: { realName: { contains: params.keyword } } },
              { leader: { nickname: { contains: params.keyword } } },
              { leader: { phone: { contains: params.keyword } } },
              { trip: { routeName: { contains: params.keyword } } },
            ],
          }
        : {}),
    },
    include: {
      leader: { select: { realName: true, nickname: true, phone: true } },
      trip: { select: { routeName: true } },
    },
    orderBy: { submittedAt: "asc" },
    take: 200,
  });

  return applications.map((application) =>
    issue({
      code: "STALE_SCORE_APPLICATIONS",
      severity: "MEDIUM",
      id: application.id,
      title: "积分申请长期待审核",
      target: application.title || getApplicationTypeLabel(application.type),
      href: `/admin/score-applications/${application.id}`,
      actionLabel: "前往审核",
      fields: [
        field("提交时间", formatDateTime(application.submittedAt)),
        field("队长姓名", application.leader.realName),
        field("申请类型", getApplicationTypeLabel(application.type)),
        field("申请标题", application.title),
        field("申请分值", formatNumber(application.requestedPoints)),
        field("关联团期", application.trip?.routeName || "未关联团期"),
        field("等待天数", `${diffDays(application.submittedAt, new Date())} 天`),
      ],
    }),
  );
}

export async function getScoreRecordAnomalies(params: DataCheckParams) {
  const records = await prisma.scoreRecord.findMany({
    where: {
      scoreYearId: params.scoreYearId,
      OR: [
        { direction: "ADD", effectivePoints: { lt: 0 } },
        { direction: "DEDUCT", effectivePoints: { gt: 0 } },
        { status: "EFFECTIVE", ruleCode: null },
        { status: "EFFECTIVE", ruleCode: "" },
        { status: "EFFECTIVE", ruleSnapshotJson: null },
        { status: "EFFECTIVE", ruleSnapshotJson: "" },
      ],
      ...(params.keyword
        ? {
            AND: [
              {
                OR: [
                  { item: { contains: params.keyword } },
                  { remark: { contains: params.keyword } },
                  { ruleCode: { contains: params.keyword } },
                  { leader: { realName: { contains: params.keyword } } },
                  { leader: { nickname: { contains: params.keyword } } },
                  { leader: { phone: { contains: params.keyword } } },
                ],
              },
            ],
          }
        : {}),
    },
    include: {
      leader: { select: { realName: true, nickname: true, phone: true } },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return records.map((record) =>
    issue({
      code: "SCORE_RECORD_ANOMALIES",
      severity: "HIGH",
      id: record.id,
      title: getScoreRecordAnomalyType(record),
      target: record.item,
      href: `/admin/score-records/${record.id}`,
      actionLabel: "查看积分详情",
      fields: [
        field("发生时间", formatDateTime(record.occurredAt)),
        field("队长姓名", record.leader.realName),
        field("积分项目", record.item),
        field("direction", record.direction),
        field("effectivePoints", formatNumber(record.effectivePoints)),
        field("status", record.status),
        field("异常类型", getScoreRecordAnomalyType(record)),
      ],
    }),
  );
}

export async function getBonusSettlementRisks(params: DataCheckParams) {
  const scoreYearId = params.scoreYearId || "";
  if (!scoreYearId) return [];
  const [poolSummary, ranking, voidedRecords] = await Promise.all([
    getBonusPoolSummary(scoreYearId),
    getAdminScoreRanking({ scoreYearId, limit: "all" }),
    prisma.scoreRecord.findMany({
      where: { scoreYearId, status: "VOIDED" },
      select: {
        leaderId: true,
        leader: { select: { id: true, realName: true, nickname: true, phone: true } },
      },
    }),
  ]);
  const issues: DataCheckIssue[] = [];

  if (poolSummary.totalAmount <= 0) {
    issues.push(
      issue({
        code: "BONUS_SETTLEMENT_RISKS",
        severity: "HIGH",
        id: `${scoreYearId}-empty-pool`,
        title: "奖金池金额为 0",
        target: "奖金池",
        href: "/admin/bonus-pool",
        actionLabel: "查看奖金池",
        fields: [
          field("风险类型", "奖金池金额为 0"),
          field("总积分", "0"),
          field("带队次数", "-"),
          field("带队天数", "-"),
        ],
      }),
    );
  }

  for (const row of ranking.allRows) {
    const baseFields = [
      field("队长姓名", row.leader.realName),
      field("总积分", formatNumber(row.totalPoints)),
      field("带队次数", String(row.tripCount)),
      field("带队天数", formatNumber(row.tripDays)),
    ];

    if (row.tripCount >= 8 && row.totalPoints <= 0) {
      issues.push(
        issue({
          code: "BONUS_SETTLEMENT_RISKS",
          severity: "HIGH",
          id: `${row.leader.id}-trip-enough-no-points`,
          title: "带队达标但积分不大于 0",
          target: row.leader.realName,
          href: `/admin/score-records?leaderId=${row.leader.id}&scoreYearId=${scoreYearId}`,
          actionLabel: "查看积分明细",
          fields: [...baseFields, field("风险类型", "符合带队次数但积分为 0 或负数")],
        }),
      );
    }

    if (row.totalPoints > 0 && row.tripCount < 8) {
      issues.push(
        issue({
          code: "BONUS_SETTLEMENT_RISKS",
          severity: "MEDIUM",
          id: `${row.leader.id}-points-not-enough-trips`,
          title: "有积分但带队次数不足",
          target: row.leader.realName,
          href: "/admin/score-ranking",
          actionLabel: "查看排行榜",
          fields: [...baseFields, field("风险类型", "有积分但带队次数不足 8")],
        }),
      );
    }

    if (row.totalPoints < 0) {
      issues.push(
        issue({
          code: "BONUS_SETTLEMENT_RISKS",
          severity: "MEDIUM",
          id: `${row.leader.id}-negative-points`,
          title: "队长当前为负分",
          target: row.leader.realName,
          href: `/admin/score-records?leaderId=${row.leader.id}&scoreYearId=${scoreYearId}`,
          actionLabel: "查看积分明细",
          fields: [...baseFields, field("风险类型", "负分队长")],
        }),
      );
    }
  }

  const voidedCountByLeader = new Map<string, { count: number; leader: (typeof voidedRecords)[number]["leader"] }>();
  for (const record of voidedRecords) {
    const current = voidedCountByLeader.get(record.leaderId);
    voidedCountByLeader.set(record.leaderId, {
      count: (current?.count || 0) + 1,
      leader: record.leader,
    });
  }

  for (const [leaderId, value] of voidedCountByLeader.entries()) {
    if (value.count < 3) continue;
    issues.push(
      issue({
        code: "BONUS_SETTLEMENT_RISKS",
        severity: "LOW",
        id: `${leaderId}-many-voided-records`,
        title: "作废积分较多",
        target: value.leader.realName,
        href: `/admin/score-records?leaderId=${leaderId}&scoreYearId=${scoreYearId}&status=VOIDED`,
        actionLabel: "查看作废记录",
        fields: [
          field("队长姓名", value.leader.realName),
          field("总积分", "-"),
          field("带队次数", "-"),
          field("带队天数", "-"),
          field("风险类型", `已作废积分 ${value.count} 条`),
        ],
      }),
    );
  }

  return filterIssuesByKeyword(issues, normalizeKeyword(params.keyword));
}

export async function getScoreYearAnomalies(params: DataCheckParams) {
  const [activeYears, completedTrips] = await Promise.all([
    prisma.scoreYear.findMany({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "asc" },
      select: { id: true, name: true, startDate: true, endDate: true },
    }),
    prisma.trip.findMany({
      where: {
        status: "COMPLETED",
        ...(params.keyword
          ? {
              OR: [
                { routeName: { contains: params.keyword } },
                { region: { contains: params.keyword } },
              ],
            }
          : {}),
      },
      select: { id: true, routeName: true, endDate: true },
      orderBy: { endDate: "desc" },
      take: 200,
    }),
  ]);
  const issues: DataCheckIssue[] = [];

  if (activeYears.length === 0) {
    issues.push(
      issue({
        code: "SCORE_YEAR_ANOMALIES",
        severity: "HIGH",
        id: "score-year-no-active",
        title: "暂无 ACTIVE 积分年度",
        target: "积分年度",
        href: "/admin/score-years",
        actionLabel: "管理积分年度",
        fields: [
          field("异常类型", "没有 ACTIVE 积分年度"),
          field("处理入口", "新增或启用积分年度"),
        ],
      }),
    );
  }

  if (activeYears.length > 1) {
    issues.push(
      issue({
        code: "SCORE_YEAR_ANOMALIES",
        severity: "MEDIUM",
        id: "score-year-multiple-active",
        title: "存在多个 ACTIVE 积分年度",
        target: "积分年度",
        href: "/admin/score-years",
        actionLabel: "管理积分年度",
        fields: [
          field("异常类型", "多个 ACTIVE 年度"),
          field("ACTIVE 数量", activeYears.length),
          field("年度名称", activeYears.map((year) => year.name).join("、")),
        ],
      }),
    );
  }

  for (let index = 0; index < activeYears.length; index += 1) {
    const current = activeYears[index];
    for (const other of activeYears.slice(index + 1)) {
      if (current.startDate <= other.endDate && current.endDate >= other.startDate) {
        issues.push(
          issue({
            code: "SCORE_YEAR_ANOMALIES",
            severity: "HIGH",
            id: `score-year-overlap-${current.id}-${other.id}`,
            title: "ACTIVE 积分年度日期重叠",
            target: "积分年度",
            href: "/admin/score-years",
            actionLabel: "管理积分年度",
            fields: [
              field("年度 A", `${current.name}（${formatDate(current.startDate)} - ${formatDate(current.endDate)}）`),
              field("年度 B", `${other.name}（${formatDate(other.startDate)} - ${formatDate(other.endDate)}）`),
            ],
          }),
        );
      }
    }
  }

  for (const trip of completedTrips) {
    const covered = activeYears.some(
      (year) => year.startDate <= trip.endDate && year.endDate >= trip.endDate,
    );
    if (covered) continue;
    issues.push(
      issue({
        code: "SCORE_YEAR_ANOMALIES",
        severity: "HIGH",
        id: `trip-without-active-score-year-${trip.id}`,
        title: "已完成团期未被 ACTIVE 积分年度覆盖",
        target: trip.routeName,
        href: "/admin/score-years",
        actionLabel: "管理积分年度",
        fields: [
          field("团期名称", trip.routeName),
          field("团期结束日期", formatDate(trip.endDate)),
          field("处理建议", "新增或启用覆盖该日期的 ACTIVE 积分年度"),
        ],
      }),
    );
  }

  return filterIssuesByKeyword(issues, normalizeKeyword(params.keyword));
}

export async function getV22RuleAnomalies(params: DataCheckParams) {
  const scoreYearId = params.scoreYearId || "";
  if (!scoreYearId) return [];
  const [socialRecords, socialTripRecords, repurchaseApplications, referralRecords, violationEvents] =
    await Promise.all([
      prisma.scoreRecord.findMany({
        where: {
          scoreYearId,
          status: "EFFECTIVE",
          category: "SOCIAL",
          direction: "ADD",
        },
        include: { leader: { select: { id: true, realName: true } } },
      }),
      prisma.scoreRecord.findMany({
        where: {
          scoreYearId,
          status: "EFFECTIVE",
          tripId: { not: null },
          ruleCode: {
            in: [
              "MOMENTS_TRIP_SHARE",
              "MOMENTS_POST",
              "XHS_SIMPLE_POST",
              "XHS_QUALITY_POST",
              "XHS_POST",
            ],
          },
        },
        include: {
          leader: { select: { id: true, realName: true } },
          trip: { select: { id: true, routeName: true } },
        },
      }),
      prisma.scoreApplication.findMany({
        where: {
          scoreYearId,
          status: { in: ["PENDING", "APPROVED"] },
          ruleCode: { in: ["REPURCHASE_COMPLETED", "REPURCHASE"] },
          OR: [{ evidenceText: { not: null } }, { evidenceUrl: { not: null } }],
        },
        include: { leader: { select: { id: true, realName: true } } },
      }),
      prisma.scoreRecord.findMany({
        where: {
          scoreYearId,
          status: "EFFECTIVE",
          direction: "ADD",
          ruleCode: { in: ["REFERRAL_NEW_LEADER", "REFERRAL_REGULAR"] },
        },
        include: { leader: { select: { id: true, realName: true } } },
      }),
      prisma.violationEvent.findMany({
        where: {
          scoreYearId,
          status: "EFFECTIVE",
          OR: [
            { ruleCode: { in: ["VALID_COMPLAINT", "SAFETY_VIOLATION", "SERIOUS_COMPLAINT", "FAKE_BEHAVIOR", "REDLINE"] } },
            { type: { in: ["SAFETY", "FAKE_BEHAVIOR", "REDLINE"] } },
          ],
        },
        include: { leader: { select: { id: true, realName: true } } },
      }),
    ]);
  const issues: DataCheckIssue[] = [];

  const socialByLeader = new Map<string, { leaderName: string; points: number }>();
  for (const record of socialRecords) {
    const current = socialByLeader.get(record.leaderId) || {
      leaderName: record.leader.realName,
      points: 0,
    };
    current.points += record.effectivePoints;
    socialByLeader.set(record.leaderId, current);
  }
  for (const [leaderId, row] of socialByLeader.entries()) {
    if (row.points <= 80) continue;
    issues.push(
      issue({
        code: "V22_RULE_ANOMALIES",
        severity: "HIGH",
        id: `${leaderId}-social-cap`,
        title: "传播类年度有效积分超过 80 分",
        target: row.leaderName,
        href: `/admin/score-records?leaderId=${leaderId}&scoreYearId=${scoreYearId}&category=SOCIAL`,
        actionLabel: "查看积分明细",
        fields: [
          field("队长姓名", row.leaderName),
          field("传播有效积分", formatNumber(row.points)),
          field("年度上限", "80"),
        ],
      }),
    );
  }

  const tripRuleCount = new Map<string, { count: number; leaderName: string; tripName: string; ruleType: string; href: string }>();
  for (const record of socialTripRecords) {
    const ruleType = record.ruleCode?.startsWith("XHS") ? "小红书" : "朋友圈";
    const key = `${record.leaderId}-${record.tripId}-${ruleType}`;
    const current = tripRuleCount.get(key) || {
      count: 0,
      leaderName: record.leader.realName,
      tripName: record.trip?.routeName || "未关联团期",
      ruleType,
      href: `/admin/score-records?leaderId=${record.leaderId}&scoreYearId=${scoreYearId}`,
    };
    current.count += 1;
    tripRuleCount.set(key, current);
  }
  for (const [key, row] of tripRuleCount.entries()) {
    if (row.count <= 1) continue;
    issues.push(
      issue({
        code: "V22_RULE_ANOMALIES",
        severity: "MEDIUM",
        id: `${key}-per-trip-duplicate`,
        title: `同一团期${row.ruleType}加分超过 1 次`,
        target: row.leaderName,
        href: row.href,
        actionLabel: "查看积分明细",
        fields: [
          field("队长姓名", row.leaderName),
          field("团期", row.tripName),
          field("类型", row.ruleType),
          field("次数", row.count),
        ],
      }),
    );
  }

  const repurchaseOwner = new Map<string, { leaderIds: Set<string>; leaders: Set<string> }>();
  for (const application of repurchaseApplications) {
    const key = application.evidenceUrl || application.evidenceText || "";
    if (!key) continue;
    const current = repurchaseOwner.get(key) || { leaderIds: new Set<string>(), leaders: new Set<string>() };
    current.leaderIds.add(application.leaderId);
    current.leaders.add(application.leader.realName);
    repurchaseOwner.set(key, current);
  }
  let repurchaseIndex = 0;
  for (const [key, row] of repurchaseOwner.entries()) {
    if (row.leaderIds.size <= 1) continue;
    repurchaseIndex += 1;
    issues.push(
      issue({
        code: "V22_RULE_ANOMALIES",
        severity: "HIGH",
        id: `repurchase-duplicate-${repurchaseIndex}`,
        title: "同一复购证据归属多个队长",
        target: Array.from(row.leaders).join("、"),
        href: "/admin/score-applications?type=REPURCHASE",
        actionLabel: "查看申请",
        fields: [
          field("涉及队长", Array.from(row.leaders).join("、")),
          field("复购证据", key.slice(0, 80)),
        ],
      }),
    );
  }

  const referralByLeader = new Map<string, { leaderName: string; points: number }>();
  for (const record of referralRecords) {
    const current = referralByLeader.get(record.leaderId) || {
      leaderName: record.leader.realName,
      points: 0,
    };
    current.points += record.effectivePoints;
    referralByLeader.set(record.leaderId, current);
  }
  for (const [leaderId, row] of referralByLeader.entries()) {
    if (row.points <= 30) continue;
    issues.push(
      issue({
        code: "V22_RULE_ANOMALIES",
        severity: "MEDIUM",
        id: `${leaderId}-referral-cap`,
        title: "推荐新队长年度积分超过 30 分",
        target: row.leaderName,
        href: `/admin/score-records?leaderId=${leaderId}&scoreYearId=${scoreYearId}&category=REFERRAL`,
        actionLabel: "查看积分明细",
        fields: [
          field("队长姓名", row.leaderName),
          field("推荐积分", formatNumber(row.points)),
          field("年度上限", "30"),
        ],
      }),
    );
  }

  const violationByLeader = new Map<
    string,
    { leaderName: string; validComplaints: number; safetyViolations: number; terminalEvents: string[] }
  >();
  for (const event of violationEvents) {
    const current = violationByLeader.get(event.leaderId) || {
      leaderName: event.leader.realName,
      validComplaints: 0,
      safetyViolations: 0,
      terminalEvents: [],
    };
    if (event.ruleCode === "VALID_COMPLAINT") current.validComplaints += 1;
    if (event.ruleCode === "SAFETY_VIOLATION" || event.type === "SAFETY") current.safetyViolations += 1;
    if (["SERIOUS_COMPLAINT", "FAKE_BEHAVIOR", "REDLINE"].includes(event.ruleCode) || ["FAKE_BEHAVIOR", "REDLINE"].includes(event.type)) {
      current.terminalEvents.push(event.ruleCode || event.type);
    }
    violationByLeader.set(event.leaderId, current);
  }
  for (const [leaderId, row] of violationByLeader.entries()) {
    if (row.validComplaints < 2 && row.safetyViolations < 2 && row.terminalEvents.length === 0) {
      continue;
    }
    issues.push(
      issue({
        code: "V22_RULE_ANOMALIES",
        severity: "HIGH",
        id: `${leaderId}-bonus-disqualify-risk`,
        title: "存在奖金资格取消或年度清零事件",
        target: row.leaderName,
        href: `/admin/score-records?leaderId=${leaderId}&scoreYearId=${scoreYearId}`,
        actionLabel: "查看积分明细",
        fields: [
          field("队长姓名", row.leaderName),
          field("有效投诉次数", row.validComplaints),
          field("安全违规次数", row.safetyViolations),
          field("严重/虚假/红线事件", row.terminalEvents.join("、")),
        ],
      }),
    );
  }

  return filterIssuesByKeyword(issues, normalizeKeyword(params.keyword));
}

function buildIssueGroups(params: DataCheckParams & { scoreYearId: string }) {
  const checks: Array<{
    code: DataCheckCode;
    load: () => Promise<DataCheckIssue[]>;
  }> = [
    { code: "SCORE_YEAR_ANOMALIES", load: () => getScoreYearAnomalies(params) },
    { code: "V22_RULE_ANOMALIES", load: () => getV22RuleAnomalies(params) },
    { code: "UNBOUND_LEADERS", load: () => getUnboundLeaders(params) },
    { code: "PENDING_BIND_REQUESTS", load: () => getPendingBindRequests(params) },
    {
      code: "COMPLETED_TRIPS_WITHOUT_BASE_SCORE",
      load: () => getCompletedTripsWithoutBaseScore(params),
    },
    {
      code: "COMPLETED_TRIPS_WITH_INCOMPLETE_LEADERS",
      load: () => getCompletedTripsWithIncompleteLeaders(params),
    },
    { code: "STALE_SCORE_APPLICATIONS", load: () => getStaleScoreApplications(params) },
    { code: "SCORE_RECORD_ANOMALIES", load: () => getScoreRecordAnomalies(params) },
    { code: "BONUS_SETTLEMENT_RISKS", load: () => getBonusSettlementRisks(params) },
  ];
  const allChecks = checks.filter((check) => !params.checkType || check.code === params.checkType);

  return Promise.all(
    allChecks.map(async (check) => {
      const meta = DATA_CHECK_GROUPS.find((group) => group.code === check.code);
      const items = await check.load();
      return {
        code: check.code,
        title: meta?.title || check.code,
        description: meta?.description || "",
        suggestion: meta?.suggestion || "",
        total: items.length,
        items: items.slice(0, 20),
      } satisfies DataCheckGroup;
    }),
  );
}

function buildEmptyGroups(checkType?: DataCheckCode | "") {
  return DATA_CHECK_GROUPS.filter((group) => !checkType || group.code === checkType).map(
    (group) => ({ ...group, total: 0, items: [] }),
  );
}

function emptySystemSummary() {
  return {
    leaderTotal: 0,
    boundLeaderCount: 0,
    unboundLeaderCount: 0,
    scoreYearName: "",
    effectiveScoreRecordCount: 0,
    voidedScoreRecordCount: 0,
    pendingScoreApplicationCount: 0,
    completedTripCount: 0,
    missingBaseScoreCount: 0,
    bonusPoolAmount: 0,
    bonusEligibleLeaderCount: 0,
    negativeLeaderCount: 0,
  };
}

function emptyOverview() {
  return {
    bindingRate: 0,
    pendingApplicationCount: 0,
    missingBaseScoreCount: 0,
    scoreRecordAnomalyCount: 0,
    bonusRiskCount: 0,
    bonusPoolAmount: 0,
  };
}

function issue(input: Omit<DataCheckIssue, "description" | "suggestion" | "searchText">): DataCheckIssue {
  const meta = DATA_CHECK_GROUPS.find((group) => group.code === input.code);
  const searchText = [
    input.title,
    input.target,
    input.href,
    ...input.fields.flatMap((fieldItem) => [fieldItem.label, fieldItem.value]),
  ].join(" ");

  return {
    ...input,
    description: meta?.description || "",
    suggestion: meta?.suggestion || "",
    searchText,
  };
}

function field(label: string, value: unknown) {
  return { label, value: value === null || value === undefined || value === "" ? "-" : String(value) };
}

const tripLeaderInclude = {
  trip: {
    select: {
      id: true,
      routeName: true,
      startDate: true,
      endDate: true,
    },
  },
  leader: {
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
    },
  },
} satisfies Prisma.TripLeaderInclude;

function leaderKeywordWhere(keyword?: string): Prisma.LeaderWhereInput {
  if (!keyword) return {};
  return {
    OR: [
      { realName: { contains: keyword } },
      { nickname: { contains: keyword } },
      { phone: { contains: keyword } },
      { residentLocation: { contains: keyword } },
      { region: { contains: keyword } },
      { externalLeaderId: { contains: keyword } },
    ],
  };
}

function tripLeaderKeywordWhere(keyword?: string): Prisma.TripLeaderWhereInput {
  if (!keyword) return {};
  return {
    OR: [
      { leader: { realName: { contains: keyword } } },
      { leader: { nickname: { contains: keyword } } },
      { leader: { phone: { contains: keyword } } },
      { trip: { routeName: { contains: keyword } } },
      { trip: { region: { contains: keyword } } },
    ],
  };
}

function filterIssuesByKeyword(issues: DataCheckIssue[], keyword: string) {
  if (!keyword) return issues;
  return issues.filter((item) => item.searchText.includes(keyword));
}

function normalizeKeyword(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function getScoreYear(scoreYearId?: string) {
  if (!scoreYearId) return null;
  return prisma.scoreYear.findUnique({ where: { id: scoreYearId } });
}

function getScoreRecordAnomalyType(record: {
  direction: string;
  effectivePoints: number;
  status: string;
  ruleCode: string | null;
  ruleSnapshotJson: string | null;
}) {
  if (record.direction === "ADD" && record.effectivePoints < 0) return "加分方向但分值为负数";
  if (record.direction === "DEDUCT" && record.effectivePoints > 0) return "扣分方向但分值为正数";
  if (record.status === "EFFECTIVE" && !record.ruleCode) return "有效积分缺少规则编码";
  if (record.status === "EFFECTIVE" && !record.ruleSnapshotJson) return "有效积分缺少规则快照";
  return "积分记录异常";
}

function maskPhone(phone: string | null | undefined) {
  if (!phone) return "-";
  return `****${phone.slice(-4)}`;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "未记录";
  return value.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "未记录";
  return value.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function diffDays(from: Date, to: Date) {
  return Math.max(Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)), 0);
}
