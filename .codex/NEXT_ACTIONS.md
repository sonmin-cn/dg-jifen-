# Next Actions

* [x] 1. 创建桌面合并前备案目录，保存源工作树和桌面目标工作树的 status/log/diff/stat，并复制目标 `backups` 目录。
* [ ] 2. 在源工作树运行 `git diff --check`，暂存 `.codex` 状态文件和两份 docs 指南，并创建提交 `docs: add trial run and tester guides`。
* [ ] 3. 推送 `codex/cloudbase-run-migration` 到 GitHub origin。
* [ ] 4. 在 `/Users/sonmin/Desktop/积分系统开发` stash `next-env.d.ts`，保留 `backups/dev-before-seed-rules-20260522-173824.db` 未跟踪。
* [ ] 5. 在桌面目标工作树执行 `git merge --ff-only codex/cloudbase-run-migration`。
* [ ] 6. 合并后运行 `npm run typecheck` 和 `npm run build`。
* [ ] 7. 检查最终 `git status --short --untracked-files=all` 和最近提交，向用户汇报。

## Done This Session

* [x] 用户确认外键和 `_prisma_migrations` 记录已经完成。
* [x] 已检查 `prisma/seed-rules.ts` 和 `lib/services/score-rules.ts`。
* [x] 已生成 `.codex/CLOUDBASE_SEED_SQL.md`，包含 5 个默认系统账号、1 个默认积分年度、42 条默认积分规则。
* [x] 已确认默认系统账号初始密码为 `123456`，只用于 Staging 首次验收，后续必须修改。
* [x] 已按恢复流程读取 `AGENTS.md` 和 `.codex` 状态文件，并检查当前分支、状态和 diff。
* [x] 已确认当前问题是 CloudBase 云托管与 MySQL 网络隔离导致的额外私网成本风险。
* [x] 已在 `AGENTS.md` 新增前期成本/付费服务评估规则。
* [x] 已在 `.codex/DECISIONS.md` 和 `.codex/PLANS.md` 记录 CloudBase 私有网络成本风险和暂停盲目推进约束。
* [x] 已检查 `git diff --stat` 和相关 diff，确认本次只改规则/状态记录，不改业务代码。
* [x] 用户已开通私有网络服务，继续当前 CloudBase 路线。
* [x] 截图确认 `User` 表已有 5 个默认账号，`Leader` 表当前暂无数据。
* [x] 已检查登录接口、登录表单、session 跳转逻辑、MVP 烟测脚本和验收清单。
* [x] 已检查现有代码，暂未发现明显的管理员改密页面或 API。
* [x] 用户截图确认 `/login` 页面可打开，但提交 `admin / 123456` 显示 `登录请求失败，请稍后重试`。
* [x] 已确认该错误来自前端 catch，不是登录接口返回的“用户名或密码错误”。
* [x] 已检查 `writeAuditLog` 有 try/catch，审计日志失败不会阻断登录；更可能是 `prisma.user.findUnique` 处 MySQL/环境变量/服务端错误。
* [x] 日志确认根因：Prisma 在读取 `User` 时连接 MySQL 认证失败，云托管 `DATABASE_URL` 的数据库凭据无效。
* [x] 已确认当前应在 `SQL 型数据库 -> 数据库设置 -> 账号管理` 处理 MySQL 数据库账号；Staging 可重置现有 `root` 密码快速修复，长期建议创建应用专用数据库账号。
* [x] 新日志确认部署 `004` 已使用新数据库账号，但 MySQL 仍拒绝该账号认证；问题集中在账号密码/主机配置本身。
* [x] 用户确认新账号已创建、密码与 `DATABASE_URL` 一致，但登录仍失败；下一步需要验证 Host/Grant，或用 root 做分叉测试。
* [x] 用户确认已成功登录 CloudBase 应用后台。
* [x] 已确认队长端需要 `LEADER` 用户和手机号匹配的未绑定 `Leader` 档案，绑定审批后才能验收完整队长端。
* [x] 用户确认队长端已经可以登录。
* [x] 已检查图片上传代码，确认当前失败重点应排查 COS 环境变量、密钥权限、bucket/region/public URL 或 CloudBase 日志。
* [x] CloudBase 日志确认 COS 返回 `403 InvalidAccessKeyId`，当前 `COS_SECRET_ID` 不是有效的腾讯云 CAM SecretId 格式。
* [x] 用户确认队长端可以提交照片，后台打开 COS 图片直链返回 XML `AccessDenied`；已确认是对象匿名读权限问题。
* [x] 用户选择 CloudBase 云存储公有读后，队长端与后台仍显示破图；下一步需确认该权限是否保存并作用于原始 COS URL。
* [x] 用户确认队长端验收完成。
* [x] 用户询问数据库密码、`SESSION_SECRET`、COS/CAM Secret 如何生成。
* [x] 已确认后台账号位于 `User` 表，密码哈希格式为 `pbkdf2_sha512`，默认账号可通过 `status='DISABLED'` 禁用。
* [x] 已创建 `.codex/CREATE_ADMIN_ACCOUNT_SQL.md`，包含新后台管理员创建、查询验证和默认账号禁用 SQL 模板。
* [x] 已确认创建新管理员账号不需要新增云服务或额外付费资源。
* [x] 用户报告当前验收已经通过。
* [x] 已运行 `npm run typecheck`，结果通过。
* [x] 已运行 `npm run build`，结果通过。
* [x] 已判定当前可进入小范围内部试运行，但正式生产运行前仍需完成安全、备份、COS 权限和运维收口。
* [x] 用户确认数据库密码、COS/CAM Secret 已更改。
* [x] 用户确认默认 seed 账号已禁用或改密。
* [x] 用户确认 `SESSION_SECRET` 尚未更改。
* [x] 已实现 `/api/evidence-images/[...key]` 后端代理读取 COS 私有图片。
* [x] 已将上传预览、后台审核详情、积分台账详情改为使用代理图片 URL。
* [x] 已运行 `npm run typecheck`，结果通过。
* [x] 已运行 `npm run build`，结果通过。
* [x] 已运行 `git diff --check`，结果通过。
* [x] 已按恢复流程读取 `AGENTS.md`、`.codex` 状态文件并检查当前 git 状态，准备生成 CloudBase 上传包。
* [x] 已生成 `/Users/sonmin/Desktop/leader-score-system-cloudbase-20260706-1638.zip`。
* [x] 已复制最新版到 `/Users/sonmin/Desktop/leader-score-system-cloudbase.zip`。
* [x] 已验证 zip 不包含 `.env`、`.git`、`.codex`、`node_modules`、`.next`、`uploads`。
* [x] 已验证 zip 包含 `Dockerfile`、`.dockerignore`、`package.json`、`package-lock.json`、`next.config.ts`、`prisma/schema.prisma`、`app/api/evidence-images/[...key]/route.ts`。
* [x] 已确认当前截图选项为公有读，最终应在新版本部署成功后改为 `仅管理员可读写`。
* [x] 用户报告 CloudBase 新版本已完成部署，进入部署后验收阶段。
* [x] 已确认用户当前截图停留在 Elements 面板，且 `/leader/applications` 列表页不会触发 `evidence-images` 图片请求。
* [x] 已完成反向泄露检查：COS 原始链接无登录返回 403 AccessDenied；代理链接无登录返回 401 请先登录。
* [x] 用户报告部署后图片访问验证已完成，当前进入发布后计划阶段。
* [x] 已按恢复流程读取项目状态和 git 状态，准备创建本地验证提交。
* [x] 本轮提交前 `git diff --check` 通过。
* [x] 本轮提交前 `npm run typecheck` 通过。
* [x] 已暂存当前工作区全部变更并检查 staged 文件清单。
* [x] 已创建本地 commit，提交信息为 `数据访问私有读写（已验证）`。
* [x] 已按恢复流程读取项目状态和 git 状态，准备生成试运行操作说明文档。
* [x] 已确认本机 `lark-cli` 可用，`lark-cli doctor` 通过。
* [x] 已生成 `docs/TRIAL_RUN_GUIDE.md`。
* [x] 已运行 `git diff --check`，结果通过。
* [x] 已检查文档中未包含真实密钥、密码、完整 `DATABASE_URL` 或私密图片链接。
* [x] 已通过 `lark-cli docs +create --api-version v2 --doc-format markdown` 创建飞书文档。
* [x] 已通过 `lark-cli docs +fetch` 拉取验证飞书文档内容。
* [x] 已生成 `docs/INTERNAL_TESTER_GUIDE.md`，覆盖内测人员登录、注册、绑定、加分申请、后台审核、测试清单和反馈模板。
* [x] 已运行 `git diff --check`，结果通过。
* [x] 已检查内测指南未包含真实密钥、密码、完整 `DATABASE_URL` 或私密图片链接。
* [x] 已通过 `lark-cli docs +create --api-version v2 --doc-format markdown` 创建内测人员操作指南飞书文档。
* [x] 已通过 `lark-cli docs +fetch` 拉取验证飞书文档内容。
* [x] 已按恢复流程读取 `AGENTS.md`、`.codex` 状态文件并检查源工作树与桌面目标工作树当前状态。
* [x] 已确认本次合并目标是桌面项目当前分支 `feat/leader-score-rules-v2-2`，不切换到 `main`。
* [x] 已创建桌面备案目录 `/Users/sonmin/Desktop/积分系统合并前备案-20260707-182049`，保存两个工作树的 status/log/diff/stat，并复制目标 `backups` 目录。
