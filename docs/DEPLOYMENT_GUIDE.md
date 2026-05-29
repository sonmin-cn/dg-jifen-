# 部署与数据初始化说明

本文用于说明试运营 / 生产环境中如何安全同步基础配置，尤其是 V2.2 积分规则。默认原则：配置 seed 不得清空业务数据，测试数据 seed 只能在本地开发库使用。

## 一、推荐命令

### 同步积分规则和系统基础配置

用于试运营、生产或本地环境同步默认规则：

```bash
npm run seed:rules
```

该命令只会：

- upsert `ScoreRule` 默认规则；
- 确保默认 `ScoreYear` 配置存在；
- 确保系统角色测试账号存在；
- 不删除业务数据。

禁止在 `seed:rules` 中删除以下业务表：

- `Leader`
- `Trip`
- `TripLeader`
- `ScoreRecord`
- `ScoreApplication`
- `ViolationEvent`
- `BonusPool`
- `BonusSettlement`
- `BonusSettlementItem`
- 其他业务流水和审计数据

### 本地测试数据重置

仅限本地开发环境使用：

```bash
CONFIRM_SEED_TEST=RESET_LOCAL_DATA npm run seed:test
```

该命令会清空并重建本地测试业务数据，已加入两层保护：

- `NODE_ENV=production` 时禁止执行；
- 必须显式设置 `CONFIRM_SEED_TEST=RESET_LOCAL_DATA`。

不要在试运营或生产数据库执行 `seed:test`。

## 二、Prisma 默认 seed

`npm run prisma:seed` 和 `prisma db seed` 当前指向安全的 `seed:rules` 流程，不再执行测试数据重置。

## 三、V2.2 规则上线建议

1. 部署代码。
2. 执行数据库迁移检查：
   ```bash
   npx prisma validate
   ```
3. 同步规则配置：
   ```bash
   npm run seed:rules
   ```
4. 登录后台 `/admin/score-rules` 核对 `BASE_TRIP`、传播类、节假日、复购、扣分类规则是否启用。
5. 如已有历史积分，不自动重算。需要修正时走“积分作废 / 重新生成 / 专项补录”流程。

## 四、上线前检查

```bash
npx prisma validate
npm run typecheck
npm run build
npm run mvp:check
```

如果 `npm run mvp:check` 在受限沙箱环境中因 `tsx` IPC 权限失败，请在正常终端中重试。
