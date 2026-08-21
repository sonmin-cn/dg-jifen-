# Task State

## Current Task

* Task ID: phone-login-and-repurchase-name-20260820
* Task Name: 队长手机号登录与老队员复购字段调整
* User Request: 1. 队长登录改为手机号登录；2. 老队员复购将“复购订单号（必填）”改为填写老用户姓名且非必填。
* Status: needs_review
* Started At: 2026-08-20 CST
* Last Updated: 2026-08-20 17:16 CST

## Current Goal

代码与本地验证已完成；等待用户决定是否提交/合并截图对应的 `worktree-fix-review-findings` 分支，并在部署前执行新增 MySQL migration。

## Completed

* [x] 读取 `AGENTS.md` 和根目录 `.codex/` 状态文件，检查 `main` 真实状态。
* [x] 确认截图对应 `.claude/worktrees/fix-review-findings` 的较新代码，而非较旧 `main`。
* [x] 读取该工作树 `AGENTS.md`、`.codex/` 状态和代码，确认业务代码原本干净。
* [x] 在 `worktree-fix-review-findings` 实现 11 位手机号登录，同时保留后台用户名登录。
* [x] 新增 `ScoreApplication.repurchaseCustomerName` 可空字段和 MySQL migration。
* [x] 将队长复购申请及重新提交改为“老用户姓名（选填）”。
* [x] 移除新申请的订单号必填、自动订单查重和批准订单键写入；历史订单字段保留只读兼容。
* [x] 后台审核详情、搜索、审计和积分快照已同步姓名字段。
* [x] Prisma validate/generate、TypeScript、Next build 和 `git diff --check` 均通过。
* [x] 已在隔离本地环境完成浏览器、接口、数据库持久化、后台详情和登录审计验收。
* [x] 临时服务与验收数据已清理，MySQL Prisma Client 已恢复，最终 typecheck/diff 检查通过。

## In Progress

* 当前正在处理的事项：无本地编码事项；等待提交、合并、迁移和部署授权。
* 当前涉及文件：业务修改均位于 `.claude/worktrees/fix-review-findings` 工作树；根目录只更新 `.codex/` 恢复记录。

## Next Actions

* [ ] 用户确认后在 `worktree-fix-review-findings` 提交本轮修改。
* [ ] 决定是否将该分支（包含此前评审修复）合并回 `main`。
* [ ] 部署前在目标 MySQL 执行 `20260820090000_add_repurchase_customer_name` migration。
* [ ] 部署后验证队长手机号登录、后台用户名登录和姓名为空的复购申请。

## Modified Files

* 根目录 `.codex/TASK_STATE.md`、`.codex/NEXT_ACTIONS.md`、`.codex/WORKLOG.md`、`.codex/DECISIONS.md`：记录定位、实施分支和恢复说明。
* `.claude/worktrees/fix-review-findings/app/api/auth/login/route.ts`：手机号/用户名兼容登录。
* `.claude/worktrees/fix-review-findings/app/login/LoginForm.tsx`、`page.tsx`：登录输入和说明。
* `.claude/worktrees/fix-review-findings/app/leader/applications/new/ApplicationCreateForm.tsx`、`page.tsx`：老用户姓名选填及重新提交预填。
* `.claude/worktrees/fix-review-findings/app/admin/score-applications/[id]/page.tsx`：后台显示姓名与历史订单号。
* `.claude/worktrees/fix-review-findings/lib/services/score-applications.ts`：姓名存储、搜索、审计、快照及取消订单自动查重。
* `.claude/worktrees/fix-review-findings/prisma/schema.prisma` 和 `prisma/migrations/20260820090000_add_repurchase_customer_name/migration.sql`：数据库字段与迁移。
* 该工作树 `.codex/` 四个状态文件：记录实施与验证详情。

## Verification

* 已运行命令：工作树内 Prisma validate/generate、`npm run typecheck`、`npm run build`、`git diff --check`；隔离 SQLite 兼容环境的浏览器手机号登录、两种复购提交、后台用户名 API 登录、数据库/审计查询和后台详情检查；清理后再次 typecheck/diff。
* 结果：全部通过；手机号与用户名登录方式记录正确，姓名空/非空持久化正确，旧订单号均未写入，后台详情显示正确，浏览器无 warning/error。
* 尚未运行但需要运行的命令：目标环境 migration、部署及正式 MySQL 运行时复验。

## Risks / Notes

* 风险点：截图对应分支比 `main` 多两个既有提交且尚未合并；不能只把本轮改动误认为已进入 `main`。
* 风险点：新增字段必须先迁移目标 MySQL 再发布应用，否则新版本读写该字段会失败。
* 注意事项：正式规则“同一订单只归属 1 名队长”仍作为人工审核口径；系统不再收集订单号，因此不做自动订单号查重。
* 注意事项：本轮未提交、未合并、未部署、未修改云资源，不新增付费项。

## Recovery Instructions

如果任务中断，下一次 Codex 必须：

1. 读取本文件；
2. 执行根目录和 `.claude/worktrees/fix-review-findings` 两处 `git status --short`；
3. 在该工作树检查 Modified Files；
4. 从 Next Actions 第一项未完成任务继续；
5. 继续前补充一条恢复日志。
