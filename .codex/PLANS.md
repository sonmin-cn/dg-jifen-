# CloudBase Staging Migration Plan

## 背景

当前项目是 Next.js + Prisma + SQLite 的队长积分系统。用户要求实施 CloudBase 云托管迁移执行版计划：先完成 Staging 云端测试环境准备，路径为 CloudBase 云托管 + MySQL + 腾讯云 COS，不迁移本地 SQLite 数据。

## 目标

- 让现有后台/API 能以容器方式部署到 CloudBase 云托管。
- 将 Prisma 数据源切换为 MySQL，并提供 clean MySQL 初始 migration。
- 将积分申请证明图片上传从容器本地磁盘切换为 COS。
- 提供 Staging 环境变量、初始化命令和验收说明。

## 非目标

- 不直接生产上线。
- 不迁移当前本地 SQLite 数据。
- 不开发完整微信小程序。
- 不写入任何真实密钥、token、密码或私密配置。

## 当前代码理解

- `prisma/schema.prisma` 当前 datasource provider 为 `sqlite`。
- `prisma/migrations/migration_lock.toml` 当前 provider 为 `sqlite`。
- `next.config.ts` 当前没有 standalone 输出配置。
- 当前没有 `Dockerfile` 或 `.dockerignore`。
- `app/api/leader/applications/upload-evidence/route.ts` 当前写入 `public/uploads/score-applications` 本地目录。
- `package.json` 已有 `typecheck`, `build`, `prisma:generate`, `seed:rules`, `mvp:check`。

## 分阶段计划

1. Phase 0 - 恢复文件和分支准备。
2. Phase 1 - 只读检查迁移入口，并创建实施分支。
3. Phase 2 - 部署可运行：Dockerfile、`.dockerignore`、Next standalone。
4. Phase 3 - MySQL 化：Prisma provider、migration lock、clean MySQL migration、环境变量模板。
5. Phase 4 - COS 上传：新增 COS SDK，替换本地文件写入，保持 API 返回结构。
6. Phase 5 - 文档和验证：补充 Staging 初始化命令，运行 typecheck/build，记录不能完成的外部验收。

## 每阶段验收标准

- Phase 0: `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/PLANS.md` 已更新。
- Phase 1: 位于 `codex/cloudbase-run-migration` 分支，已确认待改文件。
- Phase 2: Next build 配置可用于容器部署。
- Phase 3: Prisma schema 与 migration lock 使用 MySQL；migration SQL 为 MySQL 初始结构。
- Phase 4: 上传接口不再写本地磁盘；缺少 COS 配置时返回明确错误。
- Phase 5: `npm run typecheck` 和 `npm run build` 至少完成；如 MySQL/COS 不可用，状态文件记录原因。

## 当前进度

- Phase 0 done.
- Phase 1 done.
- Phase 2 done.
- Phase 3 done.
- Phase 4 done.
- Phase 5 done locally, including COS service-layer URL validation and score record evidence preview support; branch is submitted for Staging deployment; external Staging validation pending.

## 已完成

- 已读取 `AGENTS.md` 和 `.codex/` 状态文件。
- 已确认用户要求从“暂不实施”变为“实施计划”。
- 已创建并切换到 `codex/cloudbase-run-migration` 分支。
- 已完成部署和数据库入口只读检查。
- 已完成 standalone/Docker/env/Prisma provider/migration lock 首批改动。
- 已记录 `npx prisma validate` 因本地缺少 `DATABASE_URL` 失败。
- 已用临时 MySQL `DATABASE_URL` 验证 schema 并生成 clean MySQL 初始 migration。
- 已将两个证明图片上传接口切换到 COS helper。
- Prisma format、Prisma generate、TypeScript 检查已通过。
- 默认 `next build` 因 Turbopack 在中文路径下的内部错误失败。
- 已切换到 webpack build，`npm run build` 通过。
- 已确认本地没有 Docker，无法执行本地 MySQL 容器验证。
- 已新增 CloudBase Staging 部署指南。
- 已给 Dockerfile builder 阶段补充构建用占位 env。
- 已完成最终 git status/diff/diff-check 检查。
- 已新增共享 COS 证明图片 URL 校验 helper，并修复积分申请、专项加分服务层旧路径校验。
- 已验证旧本地路径、合法 COS URL、错误域名、`http://`、错误业务前缀、空 URL 和缺失 COS 配置的校验行为。
- 修复后 Prisma validate/generate、TypeScript 检查、Next build 和 `git diff --check` 均通过。
- 已完成部署前审计的最小修复：积分台账详情页可展示积分申请和专项加分快照中的合法 COS 证明图片。
- 最小修复后 Prisma validate/generate、TypeScript 检查、Next build 和 `git diff --check` 均通过。
- 已完成提交前检查，确认提交范围不包含真实 `.env`、密钥、本地数据库、日志、临时测试文件、无关图片或缓存。
- 已将 `.codex/` 恢复文件纳入提交范围，用于后续中断恢复。

## 未完成

- Staging MySQL migrate deploy、seed、mvp smoke check。
- Staging COS 真实上传验收。
- CloudBase 云托管部署验收。
- 当前分支已准备提交，提交后进入 Staging 云端资源创建和验收。

## 风险

- MySQL migration 生成可能因 SQLite 历史 migration 不兼容，需要 clean migration 方案。
- 本地若没有 Docker/MySQL/COS 凭据，无法完成真实数据库迁移和上传验收。
- CloudBase 控制台配置属于外部操作，只能提供命令和说明，不能在本地完全验证。
- Next 16 默认 Turbopack 在当前中文工作区路径下构建崩溃，已使用 webpack 模式绕过。
- 本地 Docker 不可用，MySQL migrate/seed/smoke 需要在 Staging MySQL 准备好后执行。
- COS URL 校验依赖 `COS_PUBLIC_BASE_URL` 与实际 bucket 公开访问域名一致，Staging 配置时需要重点核对。

## 恢复说明

如果中断，下一次必须先读取 `AGENTS.md`、`.codex/TASK_STATE.md`、`.codex/NEXT_ACTIONS.md`、`.codex/DECISIONS.md`、`.codex/WORKLOG.md` 和本文件，运行 `git status --short`，再从 `.codex/NEXT_ACTIONS.md` 第一项未完成任务继续。
