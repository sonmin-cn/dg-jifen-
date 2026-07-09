# Next Actions

* [ ] 1. staging 执行迁移前核对 ScoreRecord.applicationId 存量重复。
* [ ] 2. staging 执行 prisma migrate deploy 并按 TASK_STATE.md 验证清单回归。
* [ ] 3. 用户确认后合并 worktree-fix-review-findings 回 main。

## Done This Session

* [x] 时区统一（Asia/Shanghai）覆盖 24 个文件。
* [x] 复购订单号结构化 + 唯一键防重。
* [x] 审核事务化 + 按提交时点取规则。
* [x] 退回补充（NEEDS_MORE_INFO）+ 重新提交闭环。
* [x] 人工绑定申请闭环。
* [x] 登录文案 / SESSION_SECRET 强校验 / 队长会话 7 天。
* [x] 榜单脱敏、移动端卡片、HEIC 文案。
* [x] typecheck + build 通过。
