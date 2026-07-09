# Task State

## Current Task

* Task ID: fix-review-findings-20260709
* Task Name: 修复代码评审发现的业务与交互漏洞（工作树 worktree-fix-review-findings）
* User Request: 新建工作树，在工作树中修复评审报告列出的漏洞。
* Status: needs_review（等待用户在 staging 验证并决定合并）
* Started At: 2026-07-09
* Last Updated: 2026-07-09

## Current Goal

在独立工作树分支中完成 P0/P1 漏洞修复与 P2 快速体验修复，不合并回 main（由用户决定）。

## Completed

* [x] 创建工作树 `.claude/worktrees/fix-review-findings`（分支 worktree-fix-review-findings）。
* [x] 阅读相关源码（score-applications、bonus、session、bind、ranking 等）。

## In Progress

* 当前正在处理的事项：逐项实施修复。
* 当前涉及文件：见 Modified Files。

## Next Actions

* [ ] 1. 在 staging（MySQL）执行迁移前先核对存量重复：`SELECT applicationId, COUNT(*) FROM ScoreRecord WHERE applicationId IS NOT NULL GROUP BY applicationId HAVING COUNT(*) > 1`。
* [ ] 2. 在 staging 执行 `prisma migrate deploy` 并按验证清单人工回归（见 Verification）。
* [ ] 3. 用户确认后将分支 worktree-fix-review-findings 合并回 main。

## Modified Files

* `lib/utils/datetime.ts`（新增）：Asia/Shanghai 统一日期/时间格式化。
* 24 个页面/服务文件：本地 formatDate/formatDateTime 改为委托统一格式化（时区修复）。
* `prisma/schema.prisma` + `prisma/migrations/20260709090000_.../migration.sql`：ScoreApplication.orderNo/approvedOrderKey(unique)、ScoreRecord.applicationId unique、application↔record 改一对一。
* `lib/services/score-applications.ts`：订单号归一化查重、审核按 submittedAt 取规则、审核事务化（原子占用+事务内查重/上限）、requestMoreInfoScoreApplication、重新提交（resubmitOfId，原申请置 CANCELLED）。
* `app/api/admin/score-applications/[id]/needs-more-info/route.ts`（新增）。
* `app/admin/score-applications/ApplicationReviewActions.tsx`：新增"退回补充"动作。
* `app/admin/score-applications/[id]/page.tsx`：展示复购订单号。
* `app/leader/applications/new/*`：订单号字段、?from= 重新提交预填充、HEIC 文案。
* `app/leader/applications/page.tsx`：审核意见列、重新提交入口、移动端卡片主次互换。
* `app/api/leader/bind/manual-request/route.ts` + `app/leader/bind/ManualBindRequestForm.tsx` + `app/leader/bind/page.tsx`：人工绑定申请闭环。
* `lib/auth/session.ts`：SESSION_SECRET 生产强校验、队长会话 7 天。
* `app/login/page.tsx`：文案更新、移除后台直达链接。
* `app/leader/ranking/page.tsx`：无昵称真名脱敏。

## Verification

* 已运行命令：`npx prisma validate`、`npx prisma generate`、`npm run typecheck`（通过）、`npm run build`（通过，无告警）。
* 未做运行时验证：本地无 MySQL/Docker（.env 仍指向 SQLite，schema 为 MySQL）。
* staging 人工回归清单：
  1. 队长提交复购申请需填订单号；同订单换队长/加空格重复提交应被拒。
  2. 管理端审核：通过 / 拒绝 / 退回补充；退回后队长端"重新提交"预填充并使原申请变为已取消。
  3. 双开两个管理端标签同时审核同一申请，第二个应报"已处理"。
  4. 规则调分值后审核旧申请，应按提交时点的旧分值计分。
  5. 页面时间显示为北京时间（提交/审核时间不再差 8 小时）。
  6. 注册手机号不一致的队长可用档案姓名+手机号发起人工绑定，管理端可审核。
  7. 生产环境缺 SESSION_SECRET 时登录直接报错。

## Risks / Notes

* 风险点：ScoreRecord.applicationId 唯一约束在存量数据有重复时迁移会失败，上线前需先核对存量数据。
* 风险点：本地无 MySQL 连接，迁移 SQL 用 `prisma migrate diff` 离线生成，未在真实库执行。
* 注意事项：通知推送、申诉流程、管理端导航重构、表单防呆增强、结团反馈入口等属于功能增强，需产品决策，本次不做。

## Recovery Instructions

如果任务中断，下一次必须：

1. 读取本文件；
2. `git status --short` 查看工作树改动；
3. 从 Next Actions 第一项未完成任务继续；
4. 继续前补充一条恢复日志。
