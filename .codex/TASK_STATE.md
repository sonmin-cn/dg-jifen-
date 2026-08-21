# Task State

## Current Task

* Task ID: integrate-review-fixes-20260821
* Task Name: 修复分支整理、GitHub 备案并合并回 main
* User Request: 拆分修复、GitHub 备案、清理 main 误跟踪、合入修复分支并完整验证，最后让 main 快进并推送；遇到未知远程提交、无法判断的业务冲突、测试失败或数据风险时停止。
* Status: in_progress
* Started At: 2026-08-21 18:02 CST
* Last Updated: 2026-08-21 18:24 CST

## Current Goal

完成当前 merge commit，然后运行修复分支全量验证并第二次推送。

## Completed

* [x] 完整读取附件、项目规范、GitHub skills 和两处恢复状态。
* [x] fetch 确认 origin/main 无未知提交。
* [x] 创建并核验合并前备案 `/Users/sonmin/Desktop/积分系统合并前备案-20260821-180821`。
* [x] 正常停止 3107、恢复 MySQL Prisma Client、移走精确临时验收目录。
* [x] 创建并首次推送手机号登录、复购姓名、状态验收和远端备案提交。
* [x] main 创建保护分支并以 `e1faebd` 停止跟踪工作树 gitlink/数据库备份；`1786d09` 记录 main 清理检查点。
* [x] 执行 `git merge --no-ff main`；仅 5 个 `.codex` 文件冲突，无业务代码冲突。
* [x] 冲突按规则逐项整合：当前状态重写；DECISIONS/PLANS/WORKLOG 按标题保留双方唯一历史；main 正式 docs 和 `.gitignore` 保留。
* [x] 创建 `dc9e233 merge: sync cleaned main into review fixes`，无未合并路径或残留冲突标记。
* [x] Prisma validate/generate、typecheck、Next build、diff-check 和业务不变量检查全部通过。
* [x] 确认两个 migration、退回补充、人工绑定、上海时区、审核事务、排行榜脱敏、手机号登录、姓名选填及正式 docs 均完整保留。
* [x] 创建 `e272df9 docs: record integrated branch verification` 并推送；远端修复分支与本地为 `0 0`。

## In Progress

* 当前正在处理的事项：修复分支整合验证和第二次推送完成，等待 main 祖先检查与 ff-only。
* 当前涉及文件：`.codex/DECISIONS.md`、`.codex/NEXT_ACTIONS.md`、`.codex/PLANS.md`、`.codex/TASK_STATE.md`、`.codex/WORKLOG.md`。

## Next Actions

* [x] 确认无冲突标记/未合并路径并完成 merge commit。
* [x] 在修复分支运行 Prisma validate/generate、typecheck、build、diff-check 和业务不变量检查。
* [x] 提交整合验证记录并第二次推送修复分支，确认远端 `0 0`。
* [ ] 回到 main 做祖先检查和 `--ff-only`。
* [ ] main 最终验证、状态收口并推送 origin/main。

## Modified Files

* `.codex/*`：合并双方历史并记录当前整合进度。
* `.gitignore`：忽略本地工作树、验收目录和数据库备份。
* `docs/INTERNAL_TEST_NOTICE_20_LEADERS.md`、`docs/LEADER_SCORE_AND_BONUS_RULES.md`：来自 main 的正式文档。
* 登录、复购、评审修复代码及两个 migration：来自修复分支，合并未发生业务冲突。

## Verification

* 已运行命令：恢复/远端/备案/端口检查；提交前 diff-check/typecheck；staged diff；分支推送；main 清理路径存在性和 cached diff；merge 冲突列表。
* 结果：merge 仅状态文件冲突且已按规则解决；Prisma、类型、构建、差异与业务不变量验证全部通过。
* 尚未运行但需要运行的命令：冲突标记/未合并检查、Prisma validate/generate、typecheck、build、diff-check、业务不变量与最终 ahead/behind。

## Risks / Notes

* 风险点：数据库备份虽已停止继续跟踪，但仍存在旧 Git 历史；本轮不改写历史。
* 风险点：目标 MySQL 尚未执行 20260709 与 20260820 migrations，部署前必须先迁移。
* 注意事项：工作树和备份仍在本地；不删除保护分支或远程修复分支，不执行 CloudBase 操作。
* 成本说明：本次仅本地 Git 与 GitHub 推送，无新增付费资源。

## Recovery Instructions

如果中断，下一次必须：

1. 检查 `git status --short` 和 `git diff --name-only --diff-filter=U`；
2. 若 merge 尚未提交，确认五个状态文件无冲突标记并暂存后完成 merge commit；
3. 若 merge 已完成，从全量验证开始；
4. 不重复 push 或改写历史。
