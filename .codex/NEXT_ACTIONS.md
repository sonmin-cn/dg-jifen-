# Next Actions

* [ ] 1. 创建 Staging CloudBase 环境、MySQL 实例、COS bucket 和 HTTPS 域名。
* [ ] 2. 在云托管服务配置 `DATABASE_URL`、`SESSION_SECRET`、COS 环境变量和预留微信小程序变量。
* [ ] 3. 对 Staging MySQL 执行 `npx prisma validate`、`npx prisma generate`、`npx prisma migrate deploy`、`npm run seed:rules`、`npm run mvp:check`。
* [ ] 4. 部署 CloudBase 云托管并完成登录、上传、提交、审核、积分记录验收。
* [ ] 5. Staging 后端闭环后，再进入微信小程序队长端开发。

## Done This Session

* [x] 读取 `AGENTS.md` 和全部 `.codex/` 状态文件。
* [x] 运行 `pwd`、`git branch --show-current`、`git status --short`、`git diff --stat`。
* [x] 将任务状态切换为 CloudBase 迁移实施中。
* [x] 创建 `.codex/PLANS.md`。
* [x] 创建并切换到 `codex/cloudbase-run-migration` 分支。
* [x] 只读检查 Prisma schema/migrations、上传接口、`next.config.ts`、`package.json`、`.env.example`。
* [x] 修改 standalone/Docker/env/Prisma provider，并移除旧 SQLite migration SQL。
* [x] 记录 `npx prisma validate` 因缺少本地 `DATABASE_URL` 失败。
* [x] 使用临时 MySQL `DATABASE_URL` 验证 Prisma schema 并生成 MySQL 初始 migration。
* [x] 将两个证明图片上传接口改为 COS 存储。
* [x] `npx prisma format`、`npm run prisma:generate`、`npm run typecheck` 通过。
* [x] `npm run build` 因 Turbopack 非 ASCII 路径内部错误失败，已记录。
* [x] 将 build 脚本改为 webpack 模式后，`npm run build` 通过。
* [x] 检查 Docker 不可用，无法本地跑 MySQL 容器验证。
* [x] 新增 CloudBase Staging 部署指南。
* [x] Dockerfile builder 阶段补充构建用占位 env。
* [x] 最终 `git diff --check` 通过。
* [x] 2026-06-09 恢复审计发现：COS 上传返回值与服务层旧本地路径校验不兼容。
* [x] 2026-06-09 复跑 Prisma validate/generate、typecheck、build 均通过。
* [x] 2026-06-09 开始修复 COS URL 校验。
* [x] 新增共享 URL helper 并替换两个服务校验。
* [x] helper 逻辑检查通过：旧路径、合法 COS URL、错误域名、`http://`、错误前缀、空 URL、缺失 COS 配置均符合预期。
* [x] 修复后 Prisma validate/generate、typecheck、build、`git diff --check` 均通过。
* [x] 2026-06-09 21:06 开始 Staging 部署前收口审计。
* [x] 重新读取 `AGENTS.md` 和 `.codex/` 状态文件，并执行 `pwd`、`git branch --show-current`、`git status --short`、`git diff --stat`、`git diff --check`。
* [x] 审计发现 `app/admin/score-records/[id]/page.tsx` 仍只展示旧 `/uploads/score-applications/` 图片 URL，需最小迁移修复。
* [x] 已修复积分台账详情页证据截图提取逻辑，支持积分申请和专项加分快照中的合法 COS URL。
* [x] 修复后 `prisma validate`、`prisma generate`、`npm run typecheck`、`npm run build`、`git diff --check` 均通过。
* [x] 2026-06-09 21:31 提交前检查通过，确认没有真实 `.env`、密钥、本地数据库、日志、临时测试文件、无关图片或缓存进入提交范围。
* [x] `.codex` 恢复文件按 `AGENTS.md` 要求纳入提交范围。
