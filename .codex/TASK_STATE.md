# Task State

## Current Task

* Task ID: integrate-review-fixes-20260821
* Task Name: 修复分支整理、GitHub 备案并合并回 main
* User Request: 实际完成分支整理、拆分提交、GitHub 备案、清理 main 误跟踪内容、合并验证并推送 main；遇到未知远程提交、无法判断的业务冲突、测试失败或数据风险时停止。
* Status: in_progress
* Started At: 2026-08-21 18:02 CST
* Last Updated: 2026-08-21 18:02 CST

## Current Goal

完成两处工作树恢复检查和合并前备案；确认远端安全后，按授权顺序提交、合并、验证并推送。

## Completed

* [x] 完整读取用户附件和根目录 `AGENTS.md`。
* [x] 读取根目录与修复工作树恢复文件，检查 branch/status/log/diff/stat/worktree。
* [x] 确认根目录为 `main@4403547`，修复工作树为 `worktree-fix-review-findings@9530325`。
* [x] 确认 main 误跟踪修复工作树 gitlink 和本地数据库备份；两者当前仍存在。
* [x] 确认修复工作树只有预期的手机号登录、复购姓名、migration 和状态文件修改。
* [x] `git fetch origin` 后确认 `origin/main` 仍为 `4403547`，与本地 main 为 `0 0`，无未知提交。
* [x] 确认 3107 由指定临时验收目录中的 Next Node 服务监听（PID 70586）。
* [x] 创建并核验 `/Users/sonmin/Desktop/积分系统合并前备案-20260821-180821`，包含两处状态/日志/二进制 diff/stat 和 main-backups 副本。
* [x] 正常停止 3107 服务，恢复 MySQL Prisma Client，将精确临时目录移入废纸篓。
* [x] 确认真正的修复工作树和数据库备份仍在本地。
* [x] 修复分支完成三个拆分提交和远端备案记录提交，已两次正常推送并保持远端 `0 0`。
* [x] 创建保护分支 `codex/backup-main-before-review-20260821@4403547`。
* [x] 创建 `e1faebd chore(repo): stop tracking local worktrees and database backups`。
* [x] `.gitignore` 已加入本地 worktree/acceptance 和数据库备份规则；真实工作树与备份仍在本地。

## In Progress

* 当前正在处理的事项：修复分支首次备案和 main 误跟踪清理完成，正在收口 main 清理检查点。
* 当前涉及文件：根目录与修复工作树 `.codex/`；尚未暂存或提交业务文件。

## Next Actions

* [x] 检查并停止 3107 人工验收服务，恢复 MySQL Prisma Client，移走精确临时目录。
* [x] 创建并验证合并前备案目录及 backup 副本。
* [x] 在修复分支拆分提交并首次推送 GitHub。
* [x] 在 main 停止跟踪本地工作树和数据库备份并提交。
* [ ] 将 main 合入修复分支，完成全量验证并再次推送。
* [ ] 快进 main、最终验证、状态收口并推送 origin/main。

## Modified Files

* 根目录 `.codex/TASK_STATE.md`、`.codex/NEXT_ACTIONS.md`、`.codex/WORKLOG.md`、`.codex/DECISIONS.md`、`.codex/PLANS.md`：本次整合任务恢复入口。
* 修复工作树业务及 `.codex/` 文件：尚未提交，待按附件明确文件列表拆分。

## Verification

* 已运行命令：两处 `pwd`、`git branch --show-current`、`git status --short`、`git log --graph --decorate --oneline -15`、`git diff --stat`、`git diff --name-status`、`git worktree list --porcelain`、关键路径 `git ls-files -s`。
* 结果：远端无未知提交；修复分支首次备案完成；main 清理提交完成且本地资料未删除。
* 尚未运行但需要运行的命令：端口检查、`git fetch origin`、备案校验、Prisma validate/generate、typecheck、build、diff-check、分支 ahead/behind 与最终 push 检查。

## Risks / Notes

* 风险点：fetch 后若 `origin/main` 出现本地未知提交，立即停止。
* 风险点：业务冲突无法依据明确规则判断、测试失败或可能丢失数据时停止，不强行继续。
* 风险点：数据库备份可能已存在 Git 历史；本轮只停止继续跟踪，不改写历史。
* 注意事项：不删除工作树、备份、旧分支或保护分支；不 force push、不 rebase、不连接 CloudBase、不执行目标 migration 或部署。
* 成本说明：本次只有本地 Git 和 GitHub 推送，不新增云资源或付费服务。

## Recovery Instructions

如果任务中断，下一次必须：

1. 读取本文件及两个工作树全部恢复文件；
2. 检查两处 `git status --short` 和当前分支；
3. 检查最近一次 WORKLOG 的已完成阶段；
4. 从 `.codex/NEXT_ACTIONS.md` 第一项未完成动作继续；
5. 不重复已完成提交，不覆盖未确认修改。
