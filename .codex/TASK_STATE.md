# Task State

## Current Task

* Task ID: integrate-review-fixes-20260821
* Task Name: 修复分支整理、GitHub 备案并合并回 main
* User Request: 拆分当前修复、推送 GitHub 备案、合入清理后的 main、完整验证，再让 main 快进并推送；遇到未知远程提交、无法判断的业务冲突、测试失败或数据风险时停止。
* Status: in_progress
* Started At: 2026-08-21 18:02 CST
* Last Updated: 2026-08-21 18:02 CST

## Current Goal

在任何提交前完成远端核对、服务清理和合并前备案，然后按明确文件清单拆分提交。

## Completed

* [x] 完整读取用户附件、`AGENTS.md` 和 GitHub 操作技能。
* [x] 读取两处恢复文件并核对真实 Git 状态。
* [x] 确认当前分支 `worktree-fix-review-findings@9530325`，包含既有提交 `6e85948`、`9530325`。
* [x] 确认当前未提交业务文件只涉及手机号登录、复购姓名选填和新增 migration。
* [x] 确认此前隔离验收通过，但用户又启动了精确临时目录，需在提交前停止和清理。
* [x] fetch 后确认 `origin/main` 未变化且与本地 main 为 `0 0`。
* [x] 确认 3107 监听服务来自指定临时人工验收目录。
* [x] 创建并校验独立合并前备案 `/Users/sonmin/Desktop/积分系统合并前备案-20260821-180821`。
* [x] 正常停止 3107 服务，恢复 MySQL Prisma Client，精确临时目录已移入废纸篓。
* [x] 提交前 `git diff --check` 与 `npm run typecheck` 通过。
* [x] 创建 `46c41a1 feat(auth): support leader phone login`。
* [x] 创建 `39eca61 feat(repurchase): replace required order number with optional customer name`。

## In Progress

* 当前正在处理的事项：提交前验证通过；手机号和复购业务提交已创建，正在收口状态与验收记录提交。
* 当前涉及文件：`.codex/` 状态文件；业务文件尚未暂存。

## Next Actions

* [x] 停止 3107 服务、恢复 MySQL Prisma Client并清理精确临时目录。
* [x] 完成备案校验后运行 `git diff --check` 和 `npm run typecheck`。
* [ ] 提交任务状态与验收记录（两个业务提交已完成）。
* [ ] 推送修复分支到 GitHub 备案。
* [ ] 合入清理后的 main，完成全量验证和第二次推送。
* [ ] 等待 main 快进、最终验证和推送完成。

## Modified Files

* `.codex/*`：本次整合恢复状态和历史记录。
* `app/api/auth/login/route.ts`、`app/login/LoginForm.tsx`、`app/login/page.tsx`：手机号/用户名兼容登录。
* `app/admin/score-applications/[id]/page.tsx`、`app/leader/applications/new/*`、`lib/services/score-applications.ts`：复购姓名选填及历史兼容。
* `prisma/schema.prisma`、`prisma/migrations/20260820090000_add_repurchase_customer_name/migration.sql`：可空姓名字段及 migration。

## Verification

* 已运行命令：恢复检查、fetch、备案校验、Prisma Client 恢复、`git diff --check`、`npm run typecheck`、两组 staged diff/check 和敏感模式扫描。
* 结果：远端安全、备案与清理完成，提交前检查通过；两个业务提交边界正确，敏感模式扫描通过。
* 尚未运行但需要运行的命令：端口检查、fetch/备案、Prisma validate/generate、typecheck、build、diff-check、业务不变量检查、ahead/behind。

## Risks / Notes

* 风险点：远端未知提交、业务冲突无法判断、验证失败或数据丢失风险将触发停止。
* 风险点：main 当前误跟踪本工作树 gitlink，必须先在 main 安全停止跟踪，再合回本分支。
* 注意事项：不删除本工作树或数据库备份；不使用 force/rebase/reset-hard/clean；不连接 CloudBase。
* 成本说明：本次只执行本地 Git 与 GitHub 推送，不新增付费项。

## Recovery Instructions

如果任务中断，下一次必须：

1. 读取本文件和根目录恢复文件；
2. 检查两个工作树 branch/status/log；
3. 根据 WORKLOG 确认最后完成阶段和已创建提交；
4. 从 NEXT_ACTIONS 第一项未完成动作继续；
5. 不重复提交、不覆盖用户修改。
