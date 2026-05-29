import { pbkdf2Sync, randomBytes } from "node:crypto";
import { ScoreYearStatus, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../lib/db/prisma";
import { seedDefaultScoreRules } from "../lib/services/score-rules";

type SystemUserSeed = {
  username: string;
  name: string;
  phone: string;
  role: UserRole;
};

const SYSTEM_USERS: SystemUserSeed[] = [
  {
    username: "admin",
    name: "超级管理员",
    phone: "13800000001",
    role: UserRole.SUPER_ADMIN,
  },
  {
    username: "manager",
    name: "队长主管",
    phone: "13800000002",
    role: UserRole.LEADER_MANAGER,
  },
  {
    username: "finance",
    name: "财务账号",
    phone: "13800000004",
    role: UserRole.FINANCE,
  },
  {
    username: "viewer",
    name: "只读观察员",
    phone: "13800000005",
    role: UserRole.EXECUTIVE_VIEWER,
  },
  {
    username: "product",
    name: "产品经理",
    phone: "13800000006",
    role: UserRole.PRODUCT_MANAGER,
  },
];

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString(
    "hex",
  );

  return `pbkdf2_sha512$100000$${salt}$${hash}`;
}

async function ensureSystemUsers() {
  let created = 0;
  let updated = 0;

  for (const user of SYSTEM_USERS) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: user.username }, { phone: user.phone }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: user.username,
          name: user.name,
          role: user.role,
          status: UserStatus.ACTIVE,
        },
      });
      updated += 1;
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          username: user.username,
          name: user.name,
          phone: user.phone,
          passwordHash: hashPassword("123456"),
          role: user.role,
          status: UserStatus.ACTIVE,
        },
      });
      created += 1;
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) {
        throw new Error(
          `创建系统账号 ${user.username} 失败：用户名或手机号已被其他账号占用，请手动核对。`,
        );
      }
      throw error;
    }
  }

  return { created, updated };
}

function isPrismaErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

async function ensureDefaultScoreYear() {
  const existing = await prisma.scoreYear.findFirst({
    where: { name: "2026年度队长积分" },
    select: { id: true, status: true },
  });

  if (existing) {
    return { created: false, id: existing.id, status: existing.status };
  }

  const scoreYear = await prisma.scoreYear.create({
    data: {
      name: "2026年度队长积分",
      startDate: new Date("2026-01-01T00:00:00+08:00"),
      endDate: new Date("2026-12-31T23:59:59+08:00"),
      sealDate: new Date("2027-01-15T23:59:59+08:00"),
      status: ScoreYearStatus.ACTIVE,
      remark: "默认积分年度配置，可在后台积分年度管理中调整",
    },
  });

  return { created: true, id: scoreYear.id, status: scoreYear.status };
}

export async function runSeedRules() {
  const scoreRuleCount = await seedDefaultScoreRules();
  const scoreYear = await ensureDefaultScoreYear();
  const users = await ensureSystemUsers();

  console.log("Rules seed completed safely.");
  console.table([
    { item: "ScoreRule upserted", count: scoreRuleCount },
    {
      item: "ScoreYear default",
      count: scoreYear.created ? "created" : "already exists",
      id: scoreYear.id,
      status: scoreYear.status,
    },
    { item: "System users created", count: users.created },
    { item: "System users updated", count: users.updated },
  ]);
  console.log("No business data was deleted by seed:rules.");
}

runSeedRules()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
