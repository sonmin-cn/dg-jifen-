import { pbkdf2Sync, randomBytes } from "node:crypto";
import {
  LeaderStatus,
  PrismaClient,
  ScoreYearStatus,
  TripLeaderRole,
  TripStatus,
  UserRole,
} from "@prisma/client";
import { seedDefaultScoreRules } from "../lib/services/score-rules";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString(
    "hex",
  );

  return `pbkdf2_sha512$100000$${salt}$${hash}`;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.scoreRecord.deleteMany();
  await prisma.violationEvent.deleteMany();
  await prisma.bonusSettlementItem.deleteMany();
  await prisma.bonusSettlement.deleteMany();
  await prisma.bonusPool.deleteMany();
  await prisma.holidayAttendance.deleteMany();
  await prisma.repurchaseClaim.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.scoreApplication.deleteMany();
  await prisma.tripLeader.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.leaderBindRequest.deleteMany();
  await prisma.leader.deleteMany();
  await prisma.scoreYear.deleteMany();
  await prisma.user.deleteMany();

  const defaultRuleCount = await seedDefaultScoreRules();

  const [admin, manager, leaderUser, finance] = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        name: "超级管理员",
        phone: "13800000001",
        passwordHash: hashPassword("123456"),
        role: UserRole.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        username: "manager",
        name: "队长主管",
        phone: "13800000002",
        passwordHash: hashPassword("123456"),
        role: UserRole.LEADER_MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        username: "leader",
        name: "普通队长",
        phone: "13800000003",
        passwordHash: hashPassword("123456"),
        role: UserRole.LEADER,
      },
    }),
    prisma.user.create({
      data: {
        username: "finance",
        name: "财务账号",
        phone: "13800000004",
        passwordHash: hashPassword("123456"),
        role: UserRole.FINANCE,
      },
    }),
  ]);

  const scoreYear = await prisma.scoreYear.create({
    data: {
      name: "2026年度队长积分",
      startDate: new Date("2026-01-01T00:00:00+08:00"),
      endDate: new Date("2026-12-31T23:59:59+08:00"),
      sealDate: new Date("2027-01-15T23:59:59+08:00"),
      status: ScoreYearStatus.ACTIVE,
      remark: "本地开发测试积分年度",
    },
  });

  const leaderA = await prisma.leader.create({
    data: {
      userId: leaderUser.id,
      realName: "林晓青",
      nickname: "小青",
      phone: "13900000001",
      region: "华东",
      residentLocation: "上海市,上海市,徐汇区",
      status: LeaderStatus.REGULAR,
      level: "流星",
      rawLeaderIdentity: "正式队长",
      rawLeaderLevel: "流星队长(一星)",
      rawJobStatus: "在职",
      jobStatus: "ACTIVE",
      sourceSystem: "SEED",
      joinDate: new Date("2024-03-10T00:00:00+08:00"),
      tags: "摄影,亲和力",
      remark: "绑定普通队长测试账号",
    },
  });

  const leaderB = await prisma.leader.create({
    data: {
      realName: "周亦然",
      nickname: "阿然",
      phone: "13900000002",
      region: "华南",
      residentLocation: "广东省,广州市,天河区",
      status: LeaderStatus.REGULAR,
      level: "恒星",
      rawLeaderIdentity: "正式队长",
      rawLeaderLevel: "恒星队长",
      rawJobStatus: "在职",
      jobStatus: "ACTIVE",
      sourceSystem: "SEED",
      joinDate: new Date("2023-04-01T00:00:00+08:00"),
      tags: "徒步,安全",
    },
  });

  const leaderC = await prisma.leader.create({
    data: {
      realName: "陈星野",
      nickname: "星野",
      phone: "13900000003",
      region: "西南",
      residentLocation: "四川省,成都市,武侯区",
      status: LeaderStatus.INTERN,
      level: "彗星",
      rawLeaderIdentity: "实习队长",
      rawLeaderLevel: "彗星队长",
      rawJobStatus: "在职",
      jobStatus: "ACTIVE",
      sourceSystem: "SEED",
      joinDate: new Date("2026-02-15T00:00:00+08:00"),
      recommenderLeaderId: leaderB.id,
      tags: "新人带教中",
    },
  });

  const [tripA, tripB, tripC] = await Promise.all([
    prisma.trip.create({
      data: {
        routeName: "莫干山轻徒步 3 日",
        region: "华东",
        startDate: new Date("2026-05-01T08:00:00+08:00"),
        endDate: new Date("2026-05-03T18:00:00+08:00"),
        tripDays: 3,
        status: TripStatus.COMPLETED,
        participantCount: 22,
        productManagerId: manager.id,
        isHoliday: true,
      },
    }),
    prisma.trip.create({
      data: {
        routeName: "阳朔骑行 5 日",
        region: "华南",
        startDate: new Date("2026-06-12T08:00:00+08:00"),
        endDate: new Date("2026-06-16T18:00:00+08:00"),
        tripDays: 5,
        status: TripStatus.COMPLETED,
        participantCount: 18,
        productManagerId: manager.id,
      },
    }),
    prisma.trip.create({
      data: {
        routeName: "川西雪山体验 7 日",
        region: "西南",
        startDate: new Date("2026-10-01T08:00:00+08:00"),
        endDate: new Date("2026-10-07T18:00:00+08:00"),
        tripDays: 7,
        status: TripStatus.PLANNED,
        participantCount: 16,
        productManagerId: manager.id,
        isHoliday: true,
      },
    }),
  ]);

  await prisma.tripLeader.createMany({
    data: [
      {
        tripId: tripA.id,
        leaderId: leaderA.id,
        role: TripLeaderRole.MAIN,
        actualWorkDays: 3,
        isCompleted: true,
      },
      {
        tripId: tripA.id,
        leaderId: leaderC.id,
        role: TripLeaderRole.ASSISTANT,
        actualWorkDays: 3,
        isCompleted: true,
      },
      {
        tripId: tripB.id,
        leaderId: leaderB.id,
        role: TripLeaderRole.MAIN,
        actualWorkDays: 5,
        isCompleted: true,
      },
      {
        tripId: tripB.id,
        leaderId: leaderA.id,
        role: TripLeaderRole.ASSISTANT,
        actualWorkDays: 2.5,
        isCompleted: true,
      },
      {
        tripId: tripC.id,
        leaderId: leaderB.id,
        role: TripLeaderRole.MAIN,
        actualWorkDays: 0,
        isCompleted: false,
      },
    ],
  });

  await prisma.bonusPool.create({
    data: {
      scoreYearId: scoreYear.id,
      amount: 10000,
      title: "本地开发测试奖金池",
      sourceType: "MANUAL",
      description: "本地开发测试奖金池",
      injectedAt: new Date("2026-05-01T10:00:00+08:00"),
      createdBy: finance.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_INITIAL_DATA",
      targetType: "SYSTEM",
      targetId: "local-dev",
      afterJson: JSON.stringify({
        users: ["admin", "manager", "leader", "finance"],
        leaders: [leaderA.realName, leaderB.realName, leaderC.realName],
        trips: [tripA.routeName, tripB.routeName, tripC.routeName],
        scoreRules: defaultRuleCount,
      }),
    },
  });

  console.log(`Seed completed, ${defaultRuleCount} default score rules ensured`);
  console.table([
    { username: "admin", password: "123456", role: "SUPER_ADMIN" },
    { username: "manager", password: "123456", role: "LEADER_MANAGER" },
    { username: "leader", password: "123456", role: "LEADER" },
    { username: "finance", password: "123456", role: "FINANCE" },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
