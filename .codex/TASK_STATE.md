# Task State

## Current Task

* Task ID: cloudbase-run-migration
* Task Name: Commit CloudBase / MySQL / COS Staging migration branch
* User Request: Run final pre-commit checks, confirm no sensitive or temporary files are included, commit the CloudBase migration branch, and prepare the Staging deployment checklist.
* Status: done
* Started At: 2026-06-08 22:07 CST
* Last Updated: 2026-06-09 21:31 CST

## Current Goal

Local CloudBase / MySQL / COS migration branch has passed final checks and is being submitted. The next goal is Staging CloudBase, MySQL, COS, HTTPS resource creation, database initialization, deployment, and Web acceptance.

## Completed

* [x] Read `AGENTS.md`.
* [x] Read `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, and `.codex/DECISIONS.md`.
* [x] Ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] Confirmed current untracked items before implementation: `.codex/` and `AGENTS.md`.
* [x] Started Phase 0 by updating recovery state files for this implementation task.
* [x] Created and switched to branch `codex/cloudbase-run-migration`.
* [x] Inspected Prisma schema/migrations, upload route, package scripts, Next config, and env template.
* [x] Ran `npm ci` successfully to install local dependencies.
* [x] Installed `cos-nodejs-sdk-v5`.
* [x] Implemented first deployment/MySQL edit batch: standalone config, Docker files, env template, MySQL provider, migration lock, and removal of old SQLite migration SQL.
* [x] Ran `npx prisma validate`; it failed because `DATABASE_URL` is not set in this local shell.
* [x] Validated Prisma schema with a temporary MySQL `DATABASE_URL`.
* [x] Generated clean MySQL initial migration.
* [x] Replaced local evidence image writes with COS-backed upload helper for leader applications and admin score adjustments.
* [x] Ran `npx prisma format`, `npm run prisma:generate`, and `npm run typecheck` successfully.
* [x] Ran `npm run build`; it failed due a Turbopack internal error triggered by the non-ASCII workspace path.
* [x] Switched build script to webpack mode and verified `npm run build` succeeds.
* [x] Checked for Docker; Docker is not installed in this local environment.
* [x] Added CloudBase Staging deployment documentation.
* [x] Added build-time placeholder env vars to Dockerfile builder stage.
* [x] Ran final `git status --short`, `git diff --stat`, and `git diff --check`.
* [x] Ran 2026-06-09 recovery check: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and `git diff --check`.
* [x] Re-ran Prisma validate, Prisma generate, typecheck, and build successfully.
* [x] Found a half-complete COS migration issue: service-layer evidence image URL validation still only accepts old `/uploads/score-applications/` local paths.
* [x] Started COS evidence URL validation fix task after user approved implementation.
* [x] Added shared evidence URL validation helper and updated both service-layer image validators.
* [x] Verified helper logic for legacy paths, valid COS prefixes, wrong scope, wrong domain, `http://`, empty URL, and missing `COS_PUBLIC_BASE_URL`.
* [x] Re-ran Prisma validate/generate, typecheck, production build, and `git diff --check` after the COS URL validation fix.
* [x] Started Staging pre-deployment audit and re-ran recovery checks.
* [x] Applied minimal COS evidence preview fix for score record detail page.
* [x] Re-ran Prisma validate/generate, typecheck, production build, and `git diff --check` after the audit fix.
* [x] Re-read recovery files and Staging deployment documentation before commit.
* [x] Ran final pre-commit checks: `git status --short`, `git diff --stat`, `git diff --check`, Prisma validate/generate, typecheck, and production build.
* [x] Confirmed no real `.env`, secrets, local DB files, logs, temporary test files, unrelated images, or caches are staged for commit.
* [x] Decided `.codex` recovery files should be committed because `AGENTS.md` requires repository-based interruption recovery.

## In Progress

* 当前正在处理的事项：Local branch submission complete; waiting for external Staging resource configuration.
* 当前涉及文件：CloudBase deployment files, Prisma schema/migration, COS upload routes, documentation/state files.

## Next Actions

* [x] Finish reading required deployment and business-adjacent files.
* [x] Apply minimal COS evidence preview fix for score record detail page.
* [x] Re-run local readiness commands after the audit.
* [x] Decide whether any minimal non-business fix is required.
* [x] Produce final Staging resource, deployment, and acceptance checklist.
* [x] Review and commit the CloudBase migration branch.
* [ ] Prepare Staging CloudBase, MySQL, COS, and HTTPS resources.
* [ ] Deploy and run Staging acceptance.

## Modified Files

* `.codex/TASK_STATE.md`：记录当前 CloudBase 迁移任务状态。
* `.codex/NEXT_ACTIONS.md`：记录当前最小下一步。
* `.codex/DECISIONS.md`：记录开始实施、Staging 优先、COS SDK 允许新增等决策。
* `.codex/WORKLOG.md`：追加本次实施启动日志。
* `.codex/PLANS.md`：记录长任务分阶段计划和恢复说明。
* `next.config.ts`：将配置为 standalone 输出。
* `Dockerfile`：新增 CloudBase 云托管容器构建。
* `.dockerignore`：新增容器构建忽略规则。
* `.env.example`：更新为 MySQL、COS、微信小程序配置模板。
* `package.json`：新增 COS SDK 依赖。
* `package-lock.json`：记录 COS SDK 依赖树。
* `prisma/schema.prisma`：切换 datasource provider 到 MySQL。
* `prisma/migrations/`：替换为 clean MySQL 初始 migration。
* `lib/storage/cos.ts`：新增 COS 上传 helper。
* `app/api/leader/applications/upload-evidence/route.ts`：改为上传到 COS。
* `app/api/admin/score-adjustments/upload-evidence/route.ts`：改为上传到 COS。
* `package.json`：build 脚本改为 `next build --webpack`。
* `docs/`：将新增 CloudBase Staging 部署说明。
* `docs/CLOUDBASE_STAGING_DEPLOYMENT.md`：新增 Staging 资源、环境变量、初始化和验收指南。
* `docs/DEPLOYMENT_GUIDE.md`：增加 CloudBase Staging 指南入口。
* `lib/services/score-applications.ts`：使用共享 helper 校验旧本地路径和合法 COS 证明图片 URL。
* `lib/services/score-adjustments.ts`：使用共享 helper 校验旧本地路径和合法 COS 证明图片 URL。
* `lib/storage/evidence-url.ts`：新增共享证明图片 URL 校验 helper。
* `app/admin/score-records/[id]/page.tsx`：最小修复积分台账详情页证据截图提取逻辑，使其能展示合法 COS 证明图片。

## Verification

* 已运行命令：`sed -n '1,520p' AGENTS.md`, `sed -n '1,260p' .codex/TASK_STATE.md`, `sed -n '1,320p' .codex/WORKLOG.md`, `sed -n '1,220p' .codex/NEXT_ACTIONS.md`, `sed -n '1,260p' .codex/DECISIONS.md`, `sed -n '1,260p' .codex/PLANS.md`, `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, `git diff --check`, `DATABASE_URL=... npx prisma validate`, `DATABASE_URL=... npm run prisma:generate`, `npm run typecheck`, `DATABASE_URL=... SESSION_SECRET=... npm run build`, local upload path grep, `docker --version`, `COS_PUBLIC_BASE_URL=... npx tsx -e ...`.
* 结果：2026-06-09 提交前检查完成；当前分支 `codex/cloudbase-run-migration`；Prisma validate/generate、typecheck、build 和 `git diff --check` 均通过；提交范围不包含真实 `.env`、密钥、本地数据库、日志、临时测试文件、无关图片或缓存。
* 尚未运行但需要运行的命令：Staging MySQL 可用后运行 `npx prisma migrate deploy`、`npm run seed:rules`、`npm run mvp:check`，并在真实 COS 配置下验收图片上传。

## Risks / Notes

* 风险点：Prisma 从 SQLite 切到 MySQL 会影响全部数据库迁移文件，需要 clean MySQL migration。
* 风险点：COS 上传依赖外部环境变量；本地没有真实 COS 凭据时只能做编译验证，不能完成真实上传验收。
* 风险点：本地没有 `.env`；Prisma 命令需要通过临时 `DATABASE_URL` 执行，不能写入真实密钥。
* 风险点：Next 16 默认 Turbopack 在当前中文路径工作区构建会崩溃，已改用 webpack build。
* 风险点：本地没有 Docker，无法执行计划中的本地 MySQL 容器迁移/seed/smoke 验证。
* 风险点：真实 COS 上传、CloudBase 部署和 MySQL migrate/seed/smoke 仍需在 Staging 资源就绪后执行。
* 风险点：安装 COS SDK 后 npm audit 报告 13 个漏洞，本任务不执行 `npm audit fix --force`，避免引入额外破坏性升级。
* 风险点：COS URL 服务层校验已修复，但真实 COS 上传、CloudBase 部署和 MySQL migrate/seed/smoke 仍需在 Staging 资源就绪后执行。
* 风险点：积分台账详情页证据截图展示旧路径过滤逻辑已修复；真实 COS 上传、CloudBase 部署和 MySQL migrate/seed/smoke 仍需在 Staging 资源就绪后执行。
* 注意事项：不得把任何密钥写入 `.codex/` 或 `.env.example`。
* 注意事项：本阶段只做 Staging 准备，不直接生产上线，不开发完整小程序。

## Recovery Instructions

如果任务中断，下一次 Codex 必须：

1. 读取本文件；
2. 执行 `git status --short`；
3. 检查 Modified Files 中的文件；
4. 从 Next Actions 第一项未完成任务继续；
5. 继续前先补充一条恢复日志。
