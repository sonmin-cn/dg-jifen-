# Next Actions

* [ ] 1. 用户确认后在 `.claude/worktrees/fix-review-findings` 提交本轮修改。
* [ ] 2. 决定是否将 `worktree-fix-review-findings` 合并回 `main`。
* [ ] 3. 部署前在目标 MySQL 执行 `20260820090000_add_repurchase_customer_name` migration。
* [ ] 4. 发布新版本后用队长手机号和后台用户名分别登录。
* [ ] 5. 提交老用户姓名为空及填写姓名的两条复购申请，检查后台展示和审核。

## Done This Session

* [x] 已定位截图对应的较新工作树代码。
* [x] 已完成手机号/用户名兼容登录。
* [x] 已完成老用户姓名独立可空字段、申请、重提、后台、搜索、审计和快照改造。
* [x] 已保留历史订单字段和人工归属审核口径。
* [x] Prisma、TypeScript、Next build 和 diff 验证通过。
* [x] 隔离本地环境的浏览器、接口、持久化、后台详情及审计验收通过并已清理。
