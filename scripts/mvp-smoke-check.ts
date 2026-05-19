import { prisma } from "../lib/db/prisma";

type CheckLevel = "PASS" | "WARN" | "FAIL";

type CheckItem = {
  name: string;
  level: CheckLevel;
  message: string;
};

const checks: CheckItem[] = [];

function addCheck(name: string, level: CheckLevel, message: string) {
  checks.push({ name, level, message });
}

async function main() {
  const now = new Date();
  const activeScoreYear = await prisma.scoreYear.findFirst({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: "desc" },
  });

  addCheck(
    "ACTIVE ScoreYear",
    activeScoreYear ? "PASS" : "FAIL",
    activeScoreYear
      ? `${activeScoreYear.name} (${formatDate(activeScoreYear.startDate)} - ${formatDate(activeScoreYear.endDate)})`
      : "未找到覆盖当前日期的 ACTIVE 积分年度",
  );

  const baseTripRule = await prisma.scoreRule.findFirst({
    where: { code: "BASE_TRIP", isActive: true },
    orderBy: [{ version: "desc" }, { effectiveFrom: "desc" }],
  });
  addCheck(
    "BASE_TRIP Rule",
    baseTripRule ? "PASS" : "FAIL",
    baseTripRule
      ? `v${baseTripRule.version}, points=${baseTripRule.points}`
      : "未找到启用的 BASE_TRIP 规则",
  );

  if (baseTripRule?.configJson) {
    try {
      const config = JSON.parse(baseTripRule.configJson) as Record<string, unknown>;
      addCheck(
        "BASE_TRIP configJson",
        "PASS",
        `perTripPoints=${String(config.perTripPoints ?? "-")}, perDayPoints=${String(config.perDayPoints ?? "-")}`,
      );
    } catch {
      addCheck("BASE_TRIP configJson", "FAIL", "configJson 不是合法 JSON");
    }
  } else if (baseTripRule) {
    addCheck("BASE_TRIP configJson", "WARN", "未配置 configJson，将使用系统默认公式");
  }

  const adminUser = await prisma.user.findFirst({
    where: { username: "admin" },
    select: { id: true, role: true, status: true },
  });
  addCheck(
    "admin account",
    adminUser ? "PASS" : "FAIL",
    adminUser ? `${adminUser.role} / ${adminUser.status}` : "未找到 username=admin",
  );

  const leaderUser = await prisma.user.findFirst({
    where: { username: "leader" },
    select: { id: true, role: true, status: true },
  });
  addCheck(
    "leader account",
    leaderUser ? "PASS" : "WARN",
    leaderUser ? `${leaderUser.role} / ${leaderUser.status}` : "未找到 username=leader，可使用新注册队长账号验收",
  );

  const leaderCount = await prisma.leader.count();
  addCheck(
    "Leader count",
    leaderCount > 0 ? "PASS" : "WARN",
    `当前队长数量：${leaderCount}`,
  );

  const [
    addNegativeCount,
    deductPositiveCount,
    effectiveWithoutRuleCodeCount,
    pendingBindRequestCount,
    pendingScoreApplicationCount,
    completedWithoutBaseScoreCount,
  ] = await Promise.all([
    prisma.scoreRecord.count({
      where: { direction: "ADD", effectivePoints: { lt: 0 } },
    }),
    prisma.scoreRecord.count({
      where: { direction: "DEDUCT", effectivePoints: { gt: 0 } },
    }),
    prisma.scoreRecord.count({
      where: {
        status: "EFFECTIVE",
        OR: [{ ruleCode: null }, { ruleCode: "" }, { ruleSnapshotJson: null }, { ruleSnapshotJson: "" }],
      },
    }),
    prisma.leaderBindRequest.count({ where: { status: "PENDING" } }),
    prisma.scoreApplication.count({ where: { status: "PENDING" } }),
    prisma.tripLeader.count({
      where: {
        isCompleted: true,
        actualWorkDays: { gt: 0 },
        baseScoreRecordId: null,
        trip: { status: "COMPLETED" },
      },
    }),
  ]);

  addCheck(
    "ScoreRecord ADD negative",
    addNegativeCount === 0 ? "PASS" : "FAIL",
    `ADD 但 effectivePoints < 0：${addNegativeCount}`,
  );
  addCheck(
    "ScoreRecord DEDUCT positive",
    deductPositiveCount === 0 ? "PASS" : "FAIL",
    `DEDUCT 但 effectivePoints > 0：${deductPositiveCount}`,
  );
  addCheck(
    "Effective records snapshot",
    effectiveWithoutRuleCodeCount === 0 ? "PASS" : "WARN",
    `EFFECTIVE 但缺少 ruleCode 或 ruleSnapshotJson：${effectiveWithoutRuleCodeCount}`,
  );
  addCheck(
    "Pending bind requests",
    pendingBindRequestCount === 0 ? "PASS" : "WARN",
    `待审核绑定申请：${pendingBindRequestCount}`,
  );
  addCheck(
    "Pending score applications",
    pendingScoreApplicationCount === 0 ? "PASS" : "WARN",
    `待审核积分申请：${pendingScoreApplicationCount}`,
  );
  addCheck(
    "Completed TripLeader without base score",
    completedWithoutBaseScoreCount === 0 ? "PASS" : "WARN",
    `已完成但未生成基础积分的带队记录：${completedWithoutBaseScoreCount}`,
  );

  printReport();
}

function printReport() {
  console.log("MVP Smoke Check");
  console.log("================");

  for (const check of checks) {
    console.log(`[${check.level}] ${check.name}: ${check.message}`);
  }

  const summary = checks.reduce(
    (acc, check) => {
      acc[check.level] += 1;
      return acc;
    },
    { PASS: 0, WARN: 0, FAIL: 0 } as Record<CheckLevel, number>,
  );

  console.log("----------------");
  console.log(`PASS: ${summary.PASS}, WARN: ${summary.WARN}, FAIL: ${summary.FAIL}`);
  console.log("说明：该脚本只读数据库，不修改任何业务数据。WARN/FAIL 请结合 /admin/data-check 人工复核。");
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

main()
  .catch((error) => {
    console.error("MVP smoke check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
