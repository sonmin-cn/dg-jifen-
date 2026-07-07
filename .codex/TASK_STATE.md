# Task State

## Current Task

* Task ID: merge-back-to-desktop-main
* Task Name: Pre-merge archive, GitHub push, and fast-forward merge into desktop main project
* User Request: Implement the approved plan: archive both worktrees, commit docs + .codex, push `codex/cloudbase-run-migration` to GitHub, stash desktop `next-env.d.ts`, fast-forward merge into `/Users/sonmin/Desktop/积分系统开发`, then run typecheck/build.
* Status: in_progress
* Started At: 2026-07-07 18:19 CST
* Last Updated: 2026-07-07 18:19 CST

## Current Goal

Archive the current source worktree and desktop target worktree state, commit the completed trial/internal tester guide files plus recovery state, push the source branch to GitHub for remote backup, then fast-forward merge into the desktop project folder without switching to `main`.

## Completed

* [x] Recovery check on 2026-07-07 17:00 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`, and `.codex/PLANS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] Confirmed current branch is `codex/cloudbase-run-migration`.
* [x] Confirmed existing trial run guide task produced `docs/TRIAL_RUN_GUIDE.md` and a Feishu document.
* [x] Created `docs/INTERNAL_TESTER_GUIDE.md`.
* [x] Ran `git diff --check`; it passed.
* [x] Checked the generated tester guide for common secret patterns; no real secret values were found.
* [x] Ran `lark-cli doctor`; authentication and Feishu connectivity passed.
* [x] Created Feishu document `https://p9qlcjawby.feishu.cn/docx/Q320dzJBPoBH4SxWpWWcHRGun6g`.
* [x] Fetched the created Feishu document and verified the generated content is present.
* [x] Recovery check on 2026-07-07 18:19 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, and `.codex/PLANS.md`; checked source and desktop target worktree state.
* [x] Confirmed source branch is `codex/cloudbase-run-migration`.
* [x] Confirmed desktop target folder is `/Users/sonmin/Desktop/积分系统开发` on branch `feat/leader-score-rules-v2-2`.
* [x] Confirmed source branch is ahead of target branch by existing CloudBase commits and can fast-forward after the docs/state commit is added.
* [x] Created pre-merge archive directory `/Users/sonmin/Desktop/积分系统合并前备案-20260707-182049` with source/target status, logs, diffs, diff stats, and a copy of target `backups`.
* [x] Read `AGENTS.md`.
* [x] Read `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, `.codex/DECISIONS.md`, and `.codex/PLANS.md`.
* [x] Ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] Confirmed current branch is `codex/cloudbase-run-migration`.
* [x] Confirmed CloudBase environment: `leader-score-system`, environment ID `leader-score-system-d9byb5cc6528`, region Shanghai.
* [x] Confirmed CloudBase hosting default URL has been accessible: `https://leader-score-system-268536-5-1439098102.sh.run.tcloudbase.com`.
* [x] Confirmed COS bucket non-secret fields: bucket `6c65-leader-score-system-d9byb5cc6528-1439098102`, region `ap-shanghai`.
* [x] Confirmed MySQL non-secret fields previously recorded: host `172.17.0.13`, port `3306`, database `leader-score-system-d9byb5cc6528`, username redacted.
* [x] User has not shared MySQL password, full `DATABASE_URL`, CAM SecretKey, or `SESSION_SECRET`.
* [x] User confirmed all 18 business tables are now visible in CloudBase MySQL: `AuditLog`, `BonusPool`, `BonusSettlement`, `BonusSettlementItem`, `Evidence`, `HolidayAttendance`, `Leader`, `LeaderBindRequest`, `RepurchaseClaim`, `ScoreApplication`, `ScoreRecord`, `ScoreRule`, `ScoreYear`, `SocialPost`, `Trip`, `TripLeader`, `User`, `ViolationEvent`.
* [x] Created `.codex/CLOUDBASE_FOREIGN_KEYS_AND_MIGRATION_SQL.md` with 34 foreign-key statements and `_prisma_migrations` SQL copied from the Prisma MySQL migration.
* [x] User confirmed all 34 foreign keys and `_prisma_migrations` record are complete.
* [x] Inspected `prisma/seed-rules.ts`, `lib/services/score-rules.ts`, `lib/auth/password.ts`, and login API behavior.
* [x] Created `.codex/CLOUDBASE_SEED_SQL.md` for manual CloudBase SQL editor seed: 5 system accounts, 1 default score year, and 42 default score rules.
* [x] Recovery check on 2026-06-14 22:14 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] Confirmed current concern: CloudBase 云托管 and the account MySQL database are network-isolated; direct access to the private MySQL host may require paid private-network enablement.
* [x] Added `AGENTS.md` section `7.1 方案成本与付费服务评估规则`.
* [x] Recorded cost decisions and CloudBase private-network risk in `.codex/DECISIONS.md` and `.codex/PLANS.md`.
* [x] Checked official Tencent Cloud docs for CloudBase Run / MySQL VPC access behavior.
* [x] Checked `git diff --stat` and relevant diff; business code was not changed.
* [x] Recovery check on 2026-07-02 18:12 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] User reports private network service is now enabled.
* [x] User screenshot confirms `User` table has 5 default seed accounts: `admin`, `finance`, `manager`, `product`, `viewer`.
* [x] User screenshot confirms `Leader` table is currently empty, so leader-side acceptance must first create/import/register/bind leader data.
* [x] Inspected login API, login form, session helper, MVP smoke check script, and acceptance checklist.
* [x] Attempted a read-only `curl -I -L` to CloudBase `/login`; current Codex shell timed out after 20 seconds with no response, so browser-side verification remains authoritative.
* [x] Checked for a built-in password change UI/API; current code appears to support login and leader registration password hashing, but no obvious admin password-change page was found.
* [x] Recovery check on 2026-07-03 11:14 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`.
* [x] User screenshot confirms `/login` page loads but submitting `admin / 123456` displays `登录请求失败，请稍后重试`.
* [x] Inspected `LoginForm`: this message comes from the client-side catch block around `fetch("/api/auth/login")` / `response.json()`.
* [x] Inspected login route and audit helper: invalid credentials would return JSON `用户名或密码错误`; audit write failure is swallowed; likely failure is API route 500/502/non-JSON response, commonly Prisma/MySQL connection or runtime env issue.
* [x] User provided CloudBase logs showing `PrismaClientInitializationError` and `Authentication failed against database server`; root cause is invalid MySQL credentials in `DATABASE_URL`, not the app login password and not missing business seed data.
* [x] User provided new CloudBase logs for deployment `004`; logs now show authentication failure for the newly configured MySQL app account, proving the new version/environment variable took effect but the database still rejects that account/password/host combination.
* [x] User reports the new MySQL app account exists and the password in CloudBase `DATABASE_URL` matches, but login still fails with database authentication error.
* [x] User reports successful login to the CloudBase app on 2026-07-03.
* [x] Recovery check on 2026-07-03 14:48 CST: read current `.codex` state files and ran `pwd`, `git branch --show-current`, and `git status --short`.
* [x] Inspected leader-side routes: `app/leader/register/RegisterForm.tsx`, `app/api/leader/register/route.ts`, `app/leader/bind/page.tsx`, `app/api/leader/bind/request/route.ts`, and `lib/services/leader-binding.ts`.
* [x] Confirmed leader registration creates a `User` with role `LEADER`, logs in automatically, then routes to `/leader/bind`.
* [x] Confirmed leader binding matches only one unbound `Leader` profile where `Leader.phone` equals the registered user's phone.
* [x] User confirmed leader-side login works on 2026-07-03.
* [x] Recovery check on 2026-07-03 15:27 CST: read `.codex/TASK_STATE.md` and `.codex/NEXT_ACTIONS.md`; ran `pwd`, `git branch --show-current`, and `git status --short`.
* [x] Inspected `app/api/leader/applications/upload-evidence/route.ts`, `app/leader/applications/new/ApplicationCreateForm.tsx`, `lib/storage/cos.ts`, and `lib/storage/evidence-url.ts`.
* [x] Confirmed upload endpoint accepts only JPG/PNG/WEBP, max 3 files, max 5MB per file, max 15MB total.
* [x] Confirmed upload endpoint requires a bound `LEADER` account and calls `uploadEvidenceImageToCos`.
* [x] Confirmed COS upload requires `COS_SECRET_ID`, `COS_SECRET_KEY`, `COS_BUCKET`, `COS_REGION`, and `COS_PUBLIC_BASE_URL`.
* [x] User-provided CloudBase logs show COS `PUT` to the configured bucket URL returns `statusCode: 403`, `Code: InvalidAccessKeyId`, and `Message: The access key Id format you provided is invalid.`
* [x] User screenshot shows CAM sub-user creation page for `leader-score-cos-uploader`; user permission is still empty and needs COS upload permission.
* [x] User confirms leader-side photo upload now succeeds.
* [x] User-provided browser screenshot shows opening the uploaded COS URL returns XML `AccessDenied`.
* [x] Inspected admin score application detail page and confirmed it renders evidence images directly via `<img src={image.url}>` and `<a href={image.url}>`.
* [x] Confirmed `uploadEvidenceImageToCos` returns `${COS_PUBLIC_BASE_URL}/${objectKey}`; it does not generate a signed read URL.
* [x] User reports both leader-side preview and backend review still show broken images after selecting public-read/private-write in CloudBase storage.
* [x] User reports leader-side acceptance is complete on 2026-07-03.
* [x] Recovery check on 2026-07-03 17:33 CST: ran `pwd`, `git branch --show-current`, `git status --short`, and `date`.
* [x] Confirmed guidance needed for three secret types: MySQL app account password, `SESSION_SECRET`, and Tencent Cloud CAM/COS access key pair.
* [x] Recovery check on 2026-07-03 17:46 CST: ran `pwd`, `git branch --show-current`, `git status --short`, and `date`.
* [x] Inspected `lib/auth/password.ts` and confirmed app passwords use `pbkdf2_sha512$100000$salt$hash`.
* [x] Inspected `prisma/schema.prisma` and confirmed backend user roles include `SUPER_ADMIN`, `ADMIN`, `LEADER_MANAGER`, `PRODUCT_MANAGER`, `FINANCE`, and `EXECUTIVE_VIEWER`; user statuses are `ACTIVE` and `DISABLED`.
* [x] User screenshot on 2026-07-06 confirms `_prisma_migrations` table exists and contains `20260608142000_init_mysql` with checksum `f775da88a64cb7ed3e6e9bc5b1e73f76d07e0e652b914099cbaced06410a2d64` and `applied_steps_count=1`.
* [x] Recovery check on 2026-07-06 11:26 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, `.codex/DECISIONS.md`, and `.codex/PLANS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] Rechecked `lib/auth/password.ts`, `prisma/schema.prisma`, `prisma/migrations/20260608142000_init_mysql/migration.sql`, and `app/api/auth/login/route.ts`.
* [x] Created `.codex/CREATE_ADMIN_ACCOUNT_SQL.md` with a local password-hash generator, CloudBase `User` insert SQL, verification SQL, and default-account disable SQL.
* [x] User reports the current acceptance check has passed.
* [x] Recovery check on 2026-07-06 15:09 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] Ran `npm run typecheck`; it passed.
* [x] Ran `npm run build`; it passed with Next.js webpack production build.
* [x] User confirmed database password and COS/CAM Secret have been changed.
* [x] User confirmed default seed accounts have been disabled or password-changed.
* [x] User confirmed `SESSION_SECRET` has not yet been changed.
* [x] Recovery check on 2026-07-06 15:20 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and `date`.
* [x] Inspected COS upload helper, evidence URL validation helper, auth/session helpers, upload API routes, and current image rendering pages/forms.
* [x] Implemented COS evidence image backend proxy route at `app/api/evidence-images/[...key]/route.ts`.
* [x] Added COS object read helper in `lib/storage/cos.ts`.
* [x] Added COS URL to proxy URL helper in `lib/storage/evidence-url.ts`.
* [x] Updated leader/admin upload responses to return `displayUrl` for immediate private-read previews.
* [x] Updated leader upload preview, admin score adjustment preview, admin score application detail, and admin score record detail to render evidence images through the proxy URL.
* [x] Ran `npm run typecheck`; it passed after implementation.
* [x] Ran `npm run build`; it passed after implementation.
* [x] Ran `git diff --check`; it passed.
* [x] Recovery check on 2026-07-06 16:36 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/WORKLOG.md`, `.codex/NEXT_ACTIONS.md`, `.codex/DECISIONS.md`, and `.codex/PLANS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and inspected `Dockerfile` / `.dockerignore`.
* [x] Generated `/Users/sonmin/Desktop/leader-score-system-cloudbase-20260706-1638.zip`.
* [x] Copied the same package to `/Users/sonmin/Desktop/leader-score-system-cloudbase.zip` for easier CloudBase console selection.
* [x] Verified package contains 330 entries.
* [x] Verified package includes `Dockerfile`, `.dockerignore`, `package.json`, `package-lock.json`, `next.config.ts`, `prisma/schema.prisma`, and `app/api/evidence-images/[...key]/route.ts`.
* [x] Verified package does not include `.env`, `.git`, `.codex`, `node_modules`, `.next`, or `uploads`.
* [x] Recovery check on 2026-07-06 17:22 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, and `git diff --stat`.
* [x] Reviewed user's CloudBase 云存储权限截图; current selected option is public-read/admin-write.
* [x] User reports the new CloudBase deployment has completed.
* [x] Recovery check on 2026-07-06 17:25 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and `date`.
* [x] Recovery check on 2026-07-06 17:45 CST: read `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and `date`.
* [x] Reviewed user screenshot: DevTools is on the Elements panel, not Network, so it does not verify `evidence-images` requests.
* [x] Confirmed from `app/leader/applications/page.tsx` that the leader applications list only shows "有图片证明" text and does not render evidence images.
* [x] Confirmed from `app/admin/score-applications/[id]/page.tsx` that admin application detail renders evidence images through `getEvidenceImageProxyUrl(...)`.
* [x] Ran no-cookie reverse access check on 2026-07-06 18:07 CST against one uploaded COS evidence object without recording the full object URL.
* [x] Confirmed direct COS object anonymous access returns HTTP 403 with `AccessDenied`.
* [x] Confirmed `/api/evidence-images/...` anonymous access returns HTTP 401 JSON `请先登录`, not image bytes.
* [x] User reports positive verification is complete: authenticated image access works and reverse leak checks passed.
* [x] Recovery check on 2026-07-06 18:18 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`, and `.codex/PLANS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and `date`.
* [x] Recovery check on 2026-07-06 18:24 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`, and `.codex/PLANS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and `date`.
* [x] Confirmed current branch is `codex/cloudbase-run-migration`.
* [x] Confirmed the pending worktree changes are the verified private evidence image proxy implementation, CloudBase SQL/setup documents, and project recovery/state updates.
* [x] Ran `git diff --check`; it passed.
* [x] Ran `npm run typecheck`; it passed.
* [x] Staged all current worktree changes and checked the staged file list.
* [x] Created local commit with message `数据访问私有读写（已验证）`.
* [x] Ran post-commit `git status --short`; worktree was clean.
* [x] Ran post-commit `git log -1 --oneline`; latest commit message matched `数据访问私有读写（已验证）`.
* [x] Recovery check on 2026-07-07 16:38 CST: read `AGENTS.md`, `.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/DECISIONS.md`, and `.codex/PLANS.md`; ran `pwd`, `git branch --show-current`, `git status --short`, `git diff --stat`, and `date`.
* [x] Confirmed current branch is `codex/cloudbase-run-migration`.
* [x] Confirmed worktree was clean before starting the Feishu trial guide task.
* [x] Found local Feishu CLI command `lark-cli`.
* [x] Ran `lark-cli doctor`; config, user token, and Feishu connectivity were valid.
* [x] Generated `docs/TRIAL_RUN_GUIDE.md` with the complete internal trial run operation guide.
* [x] Ran `git diff --check`; it passed.
* [x] Checked the generated guide for common secret patterns; no real secret values were found.
* [x] Created the Feishu document via `lark-cli docs +create --api-version v2 --doc-format markdown`.
* [x] Fetched the created Feishu document via `lark-cli docs +fetch`; the generated content was present.

## In Progress

* 当前正在处理的事项：执行合并前备案、补充提交、GitHub 推送和桌面主项目快进合并。
* 当前涉及文件：`.codex/TASK_STATE.md`, `.codex/NEXT_ACTIONS.md`, `.codex/WORKLOG.md`, `.codex/PLANS.md`, `docs/TRIAL_RUN_GUIDE.md`, `docs/INTERNAL_TESTER_GUIDE.md`。

## Next Actions

* [x] 创建桌面合并前备案目录，保存两个工作树的 status/log/diff/stat，并复制目标 `backups` 目录。
* [ ] 在源工作树运行 `git diff --check` 并确认提交范围只包含 `.codex` 状态和两份 docs 指南。
* [ ] 提交 `.codex` 状态文件和 `docs/TRIAL_RUN_GUIDE.md`、`docs/INTERNAL_TESTER_GUIDE.md`。
* [ ] 推送 `codex/cloudbase-run-migration` 到 GitHub origin。
* [ ] 在桌面主项目 stash `next-env.d.ts`，保留 `backups/dev-before-seed-rules-20260522-173824.db` 未跟踪。
* [ ] 在桌面主项目执行 `git merge --ff-only codex/cloudbase-run-migration`。
* [ ] 合并后运行 `npm run typecheck` 和 `npm run build`。

## Modified Files

* `.codex/TASK_STATE.md`：记录当前任务、恢复检查和下一步动作。
* `.codex/NEXT_ACTIONS.md`：更新当前最小动作清单。
* `.codex/WORKLOG.md`：追加本轮恢复与文档生成日志。
* `.codex/PLANS.md`：记录合并前备案、推送和桌面主项目合并计划执行进度。
* `docs/TRIAL_RUN_GUIDE.md`：新增完整试运行操作说明文档，并已通过飞书 CLI 创建对应飞书文档。
* `docs/INTERNAL_TESTER_GUIDE.md`：新增面向内测人员的操作指南，并已通过飞书 CLI 创建对应飞书文档。
* `.codex/DECISIONS.md`：记录手工建表后必须补外键和 Prisma migration tracking 的决策。
* `.codex/PLANS.md`：更新 CloudBase Staging 当前进度。
* `.codex/CLOUDBASE_FOREIGN_KEYS_AND_MIGRATION_SQL.md`：新增逐块复制执行的外键和 `_prisma_migrations` SQL 文档。
* `.codex/CLOUDBASE_SEED_SQL.md`：新增 Staging 默认数据初始化 SQL 文档。
* `.codex/CLOUDBASE_REMAINING_TABLE_SQL.md`：此前用于剩余单表建表；当前业务表已全部完成，可作为历史操作参考。
* `.codex/CREATE_ADMIN_ACCOUNT_SQL.md`：新增安全创建后台管理员账号和禁用默认账号的 SQL 操作模板，不包含真实密码或哈希。
* `lib/storage/cos.ts`：新增 COS 对象读取 helper，用于后端代理读取私有图片。
* `lib/storage/evidence-url.ts`：新增 COS URL 到站内代理 URL 的转换 helper。
* `app/api/evidence-images/[...key]/route.ts`：新增登录态保护的后端代理路由。
* `app/api/admin/score-adjustments/upload-evidence/route.ts`：上传成功后返回 `displayUrl`，用于私有读预览。
* `app/api/leader/applications/upload-evidence/route.ts`：上传成功后返回 `displayUrl`，用于私有读预览。
* `app/admin/score-adjustments/new/ScoreAdjustmentCreateForm.tsx`：上传预览使用 `displayUrl || url`。
* `app/leader/applications/new/ApplicationCreateForm.tsx`：上传预览使用 `displayUrl || url`。
* `app/admin/score-applications/[id]/page.tsx`：后台审核详情图片使用代理 URL。
* `app/admin/score-records/[id]/page.tsx`：积分台账详情证据图片使用代理 URL。
* `lib/services/score-adjustments.ts`：允许上传响应携带非持久化 `displayUrl`。
* `lib/services/score-applications.ts`：允许上传响应携带非持久化 `displayUrl`。
* `/Users/sonmin/Desktop/leader-score-system-cloudbase.zip`：CloudBase 本地代码上传用 clean zip artifact，不包含真实密钥。
* `/Users/sonmin/Desktop/leader-score-system-cloudbase-20260706-1638.zip`：本次 CloudBase 本地代码上传用带时间戳归档，不包含真实密钥。
* `AGENTS.md`：新增“开发/部署方案前置成本评估”规则。

## Verification

* 已运行命令：`pwd`, `git branch --show-current`, `git status --short --untracked-files=all`, `git diff --stat`, `git log --oneline --decorate -6`, `date '+%Y-%m-%d %H:%M %Z'`, `sed -n '1,240p' AGENTS.md`, `sed -n '1,260p' .codex/TASK_STATE.md`, `sed -n '1,220p' .codex/NEXT_ACTIONS.md`, `tail -n 120 .codex/WORKLOG.md`, `tail -n 120 .codex/PLANS.md`, backup archive commands for source/target status/log/diff/stat and target `backups`.
* 结果：恢复检查完成；源分支为 `codex/cloudbase-run-migration`；桌面目标分支为 `feat/leader-score-rules-v2-2`；源工作树有 `.codex` 状态文件和两份 docs 未提交，目标工作树有 `next-env.d.ts` 修改和一个本地 backup 数据库未跟踪；合并前备案目录已创建。
* 尚未运行但需要运行的命令：备案目录创建与写入、`git diff --check`, `git add`, `git commit`, `git push`, `git stash push`, `git merge --ff-only`, `npm run typecheck`, `npm run build`, 最终 `git status --short --untracked-files=all`。

## Risks / Notes

* 风险点：CloudBase 云托管和当前 MySQL 位于隔离网络，用户已开通私有网络后仍需通过实际登录确认应用容器能访问 MySQL。
* 风险点：CloudBase SQL 编辑器此前对多语句脚本不稳定，seed 阶段仍应一次只执行一个代码块。
* 风险点：默认账号密码是公开 staging 初始密码 `123456`，登录成功后必须尽快修改或禁用。
* 风险点：`Leader` 表当前为空，队长端积分、绑定、团期、上传等业务验收需要先创建或导入队长档案。
* 风险点：当前 Codex shell 访问 CloudBase 默认域名超时，可能是本地执行环境网络路径问题；如果用户浏览器可以打开页面，则继续浏览器验收。
* 风险点：登录失败的当前可见提示是前端兜底文案，不能凭这个文案直接判断根因，必须看 API status 和 CloudBase 服务日志。
* 风险点：用户截图中暴露了云托管环境变量片段；后续应轮换已暴露的服务端密钥/Session Secret，并避免截图或聊天中展示完整环境变量。
* 风险点：COS Secret、Bucket、Region 或 public base URL 任一项错误都会导致图片上传失败；当前已确认 `COS_SECRET_ID` 格式无效。
* 风险点：用户截图中再次暴露了云托管环境变量内容；相关数据库密码、Session Secret、CloudBase API Key/CAM Secret 等应视为已暴露并轮换。
* 风险点：如果把 COS bucket 设置为公有读，用户上传凭证图片会被任何持有 URL 的人访问；这只适合 Staging 临时验收，不适合长期生产。
* 注意事项：队长端验收完成后，必须优先处理已暴露密钥轮换和默认账号安全，不应直接进入生产使用。
* 注意事项：创建新后台账号时，明文密码只在用户本机输入；密码哈希只应粘贴到 CloudBase SQL 编辑器，不应发送到聊天或写入仓库。
* 注意事项：必须先用新账号成功登录后台，再禁用默认账号，避免锁死后台入口。
* 注意事项：验收通过不等于生产安全收口完成；可以小范围试运行，但不要在默认账号、暴露密钥、公有读凭证图片、无备份的状态下正式长期运行。
* 注意事项：若 `SESSION_SECRET` 仍未轮换，进入正式生产前必须轮换；一旦更改，旧登录态会失效，所有用户需要重新登录，这是预期行为。
* 注意事项：后端代理读取 COS 图片会让图片流量经过云托管；小规模试运行可接受，若未来图片访问量大，再评估签名 URL 或 CDN 鉴权策略。
* 注意事项：部署本次改动前不要把 bucket 直接改为生产私有读，否则旧版本页面仍会直接请求 COS 原始 URL 并显示破图。
* 注意事项：本次 zip 已包含未提交工作区改动；如果之后继续改源码，需要重新打包再上传。
* 注意事项：CloudBase 云托管端口保持访问端口 `80`、服务端口 `3000`；`SESSION_SECRET` 轮换会让旧登录态失效，用户需要重新登录。
* 注意事项：不要在表管理 UI 中手工改字段、索引或表名。
* 注意事项：`seed:rules` 会创建默认系统账号；默认密码为 `123456`，验收后应立即修改或禁用不需要的账号。
* 注意事项：不得把 MySQL 密码、完整 `DATABASE_URL`、COS Secret、Session Secret 或其他密钥写入聊天、`.codex/`、`.env.example` 或提交记录。
* 注意事项：继续任何部署方案前，必须先列出可能新增收费项和替代方案，并让用户确认成本可接受。
* 注意事项：官方文档确认 CloudBase Run 访问腾讯云 MySQL 的标准方式是服务与 MySQL 位于同一 VPC；已有服务不支持直接更换所在 VPC，选错时需重新部署到正确 VPC 或打通多个 VPC。

## Recovery Instructions

如果任务中断，下一次 Codex 必须：

1. 读取本文件；
2. 执行 `git status --short`；
3. 检查 Modified Files 中的文件；
4. 从 Next Actions 第一项未完成任务继续；
5. 继续前先补充一条恢复日志。
