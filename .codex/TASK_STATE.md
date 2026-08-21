# Task State

## Current Task

* Task ID: integrate-review-fixes-20260821
* Task Name: 修复分支整理、GitHub 备案并合并回 main
* User Request: 实际完成分支整理、拆分提交、GitHub 备案、清理 main 误跟踪内容、合并验证并推送 main；遇到未知远程提交、无法判断的业务冲突、测试失败或数据风险时停止。
* Status: needs_review
* Started At: 2026-08-21 18:02 CST
* Last Updated: 2026-08-21 18:42 CST

## Current Goal

Git 分支整理、验证、合并和 GitHub 推送已完成；仅剩提交并推送本条最终状态记录。CloudBase migration 与部署不在本次授权范围，仍待后续执行。

## Completed

* [x] 完整读取附件、AGENTS.md、两处恢复文件和 GitHub skills。
* [x] fetch 多次确认 origin/main 和远端修复分支无未知提交。
* [x] 创建合并前备案 /Users/sonmin/Desktop/积分系统合并前备案-20260821-180821，九类内容齐全。
* [x] 正常停止 3107 验收服务、恢复 MySQL Prisma Client、将临时目录移入废纸篓。
* [x] 在修复分支创建手机号登录、复购姓名选填、验收记录和两次远端备案记录提交。
* [x] 修复分支已推送到 GitHub 并保持远端 0 0。
* [x] 创建保护分支 codex/backup-main-before-review-20260821@4403547。
* [x] main 以 e1faebd 停止跟踪工作树 gitlink 和数据库备份，以 1786d09 记录清理检查点。
* [x] main 合入修复分支，merge commit 为 dc9e233；仅五个 .codex 冲突，双方历史均保留，无业务冲突。
* [x] 修复分支 Prisma validate/generate、typecheck、build、diff-check 和业务不变量验证通过。
* [x] main 祖先检查通过并以 --ff-only 快进至 6cff490。
* [x] main Prisma validate/generate、typecheck、build、diff-check、提交图和本地路径/跟踪状态检查通过。
* [x] main 已正常推送至 GitHub 6cff490，推送后 origin/main...main 为 0 0。
* [x] 两个 migration、正式 docs、本地工作树和数据库备份均完整保留；后两者已停止 Git 跟踪。

## In Progress

* 当前正在处理的事项：创建并推送最终状态记录提交 docs: record review fixes integration completion。
* 当前涉及文件：.codex/TASK_STATE.md、.codex/NEXT_ACTIONS.md、.codex/PLANS.md、.codex/WORKLOG.md。

## Next Actions

* [ ] 提交并正常推送最终状态记录，确认 origin/main...main 为 0 0。
* [ ] 部署前先在目标 MySQL 依次执行 20260709 与 20260820 migrations。
* [ ] migration 成功后发布 CloudBase 版本。
* [ ] 部署后复验手机号/用户名登录、复购姓名空/非空、审核并发、退回补充和人工绑定。

## Modified Files

* 评审修复、手机号登录、复购姓名选填、Prisma schema 和两个 migration 已合入 main。
* .gitignore：忽略本地工作树、临时验收目录和数据库备份。
* .codex/*：保留双方历史并记录完整整合/验证/推送状态。
* docs/INTERNAL_TEST_NOTICE_20_LEADERS.md、docs/LEADER_SCORE_AND_BONUS_RULES.md：正式文档完整保留。

## Verification

* 已运行命令：两轮 Prisma validate/generate、两轮 npm run typecheck、两轮 npm run build、多轮 git diff --check、冲突标记/未合并检查、业务不变量搜索、提交图/祖先/ahead-behind 检查、路径存在与 Git 跟踪检查。
* 结果：全部通过；main 首次最终推送后与 origin/main 为 0 0。
* 尚未运行但需要运行的命令：最终状态提交后的 fetch/push 和 git rev-list --left-right --count origin/main...main。

## Risks / Notes

* 风险点：数据库备份已停止继续跟踪，但旧 Git 历史仍包含该文件；本次按授权不重写历史。
* 风险点：CloudBase MySQL 尚未执行 20260709/20260820 migrations；不得先发应用后补 migration。
* 注意事项：工作树、数据库备份、保护分支和远程修复分支均保留，不要删除。
* 注意事项：本次未连接 CloudBase、未执行目标 migration、未发布版本、未修改云资源。
* 成本说明：本次只执行本地 Git 和 GitHub 推送，无新增付费服务。

## Recovery Instructions

如果任务中断，下一次必须：

1. 检查 main 的 git status --short 和最新提交；
2. 若最终状态提交尚未创建，按当前四个 .codex 文件创建指定 docs 提交；
3. fetch 确认 origin/main 未变化后正常 push；
4. 最终确认 origin/main...main 为 0 0；
5. 后续部署从“先执行两个 migration”开始。
