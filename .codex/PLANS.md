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
- Phase 5 done locally, including COS service-layer URL validation and score record evidence preview support; branch is submitted for Staging deployment.
- Staging execution was blocked on 2026-06-09 because required environment variables were missing in the current shell and no local CloudBase CLI was available.
- 2026-06-10 正在按用户要求进入腾讯云控制台人工资源配置指导：CloudBase 环境、云托管服务、MySQL、COS、CAM API 密钥和云托管环境变量。
- 用户已创建 CloudBase 环境 `leader-score-system`，环境 ID `leader-score-system-d9byb5cc6528`，地域上海。
- 用户本地代码上传触发 CloudBase 文件数限制后，已生成 clean upload zip `/Users/sonmin/Desktop/leader-score-system-cloudbase.zip`。
- 用户确认接下来按资源依赖顺序配置：MySQL -> COS -> CAM API 密钥 -> `SESSION_SECRET` -> 云托管环境变量 -> 云托管部署。
- 用户已进入 CloudBase SQL 型数据库页面；页面显示云开发自带实例、数据库下拉 `leader-score-system-d9byb5cc6528`、空表列表。
- 用户打开了 `新建MySQL数据库连接配置` 弹窗；已判断该弹窗用于外部数据库连接器，当前路线不需要创建。
- 用户提供 MySQL 非敏感连接字段：host `172.17.0.13`、port `3306`、database `leader-score-system-d9byb5cc6528`、user redacted as `[DB-USERNAME]`。
- 用户已确认 CloudBase 云存储 / COS bucket `6c65-leader-score-system-d9byb5cc6528-1439098102`，地域 `ap-shanghai`，权限公有读私有写。
- 用户已获取服务端 API Key；SecretId / SecretKey 未共享、未记录。
- 用户已生成 `SESSION_SECRET`；真实值未共享、未记录。
- 用户当前位于 CloudBase 云托管 `服务管理` 页，服务列表为空；下一步应点击 `使用本地代码上传部署`，在服务创建/版本配置流程中填写环境变量。
- 用户已进入 CloudBase `新建本地代码部署` 页面；上传包 `leader-score-system-cloudbase.zip` 和服务名 `leader-score-system` 已就绪，下一步是将服务端口改为 `3000` 并展开环境变量设置。
- 用户已报告 CloudBase 云托管部署完成；下一步进入默认域名访问、日志检查、MySQL schema 初始化和业务验收。
- 用户确认默认域名 `https://leader-score-system-268536-5-1439098102.sh.run.tcloudbase.com` 根页面可访问；Codex 使用 `curl -I -L` 确认根路径和 `/login` 均返回 `HTTP 200`。
- 用户确认 CloudBase SQL 型数据库表列表为空；Codex 已将基于 Prisma MySQL 初始 migration 的建表 SQL 复制到剪贴板，等待用户在 SQL 编辑器执行。
- 用户询问是否可使用中文表名；已确认 Staging 初始化继续使用现有 Prisma 英文物理表名，中文名称放在 UI/文档层。
- 用户要求重新提供剪贴板内容；Codex 已重新生成并复制英文物理表名 schema 初始化 SQL。
- 用户执行完整 SQL 时 CloudBase SQL 编辑器返回 Error 1064；已改用分段执行策略，剪贴板当前只包含第一条 `CREATE TABLE User` 测试 SQL。
- 用户确认 `User` 表创建成功；剪贴板当前包含第二条 `CREATE TABLE Leader` SQL。
- 用户确认 `Leader` 表创建成功；剪贴板当前包含第三条 `CREATE TABLE LeaderBindRequest` SQL。
- 用户确认 `LeaderBindRequest` 表创建成功；剪贴板当前包含第四条 `CREATE TABLE ScoreYear` SQL。
- 用户确认 `ScoreYear` 表创建成功；剪贴板当前包含第五条 `CREATE TABLE ScoreRule` SQL。
- 用户确认 `ScoreRule` 表创建成功；剪贴板当前包含第六条 `CREATE TABLE Trip` SQL。
- 用户确认 `Trip` 表创建成功；剪贴板当前包含第七条 `CREATE TABLE TripLeader` SQL。
- 用户确认 `TripLeader` 表创建成功；剪贴板当前包含第八条 `CREATE TABLE ScoreApplication` SQL。
- 用户确认 `ScoreApplication` 表创建成功；剪贴板当前包含第九条 `CREATE TABLE ScoreRecord` SQL。
- 用户确认 `ScoreRecord` 表创建成功；剪贴板当前包含剩余 9 张业务表的 `CREATE TABLE` SQL：`Evidence`、`SocialPost`、`RepurchaseClaim`、`HolidayAttendance`、`BonusPool`、`BonusSettlement`、`BonusSettlementItem`、`ViolationEvent`、`AuditLog`。
- 用户执行剩余 9 表批量 SQL 时 CloudBase SQL 编辑器在 `CREATE TABLE SocialPost` 处报 Error 1064；继续改回单表执行，剪贴板当前包含 `CREATE TABLE SocialPost` SQL。`Evidence` 可能已由上一条语句创建，后续刷新表列表时需要确认。
- 用户确认 `SocialPost` 表创建成功；截图中表列表未显示 `Evidence`，剪贴板当前包含单表 `CREATE TABLE Evidence` SQL，用于先补缺失表。
- 用户确认 `Evidence` 表创建成功；剪贴板当前包含单表 `CREATE TABLE RepurchaseClaim` SQL。
- 用户要求提升效率；已创建 `.codex/CLOUDBASE_REMAINING_TABLE_SQL.md`，一次性列出剩余未确认表的单表 SQL 代码块。
- 用户执行 `RepurchaseClaim` 时返回 Error 1050 表已存在；已按完成处理，剪贴板当前包含单表 `CREATE TABLE HolidayAttendance` SQL。
- 用户已确认 CloudBase MySQL 表列表包含全部 18 张业务表，建表阶段完成。
- 已创建 `.codex/CLOUDBASE_FOREIGN_KEYS_AND_MIGRATION_SQL.md`，下一步按文档逐条执行 34 条外键约束，再写入 `_prisma_migrations` 记录。
- 用户已确认 34 条外键和 `_prisma_migrations` 记录完成。
- 已创建 `.codex/CLOUDBASE_SEED_SQL.md`，下一步在 CloudBase SQL 编辑器中初始化 5 个默认系统账号、1 个默认积分年度和 42 条默认积分规则。
- 2026-06-14 用户指出 CloudBase 云托管访问账号 MySQL 存在网络隔离，继续直连可能需要开通收费私有网络；当前先暂停把 CloudBase 私网直连作为默认最终方案，转为评估成本和同网络/同平台替代拓扑。
- 2026-07-02 用户已开通私有网络服务，继续 CloudBase 路线进入登录和验收；截图确认 `User` 表已有 5 个默认账号，`Leader` 表当前为空。
- 2026-07-06 `_prisma_migrations` 已由截图确认存在；已创建 `.codex/CREATE_ADMIN_ACCOUNT_SQL.md`，下一步创建新的安全后台管理员账号，登录验证后禁用默认 seed 账号。
- 2026-07-06 用户报告当前验收已经通过；`npm run typecheck` 和 `npm run build` 通过。当前可进入小范围内部试运行，正式生产前继续完成账号、密钥、COS 权限、备份和监控收口。
- 2026-07-06 用户确认数据库密码、COS/CAM Secret 已更改，默认 seed 账号已禁用或改密，但 `SESSION_SECRET` 尚未更改；已实现 `/api/evidence-images/...` 后端代理读取 COS 私有图片。

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
- 已在 2026-06-09 检查 Staging 必需环境变量；当前 shell 中全部缺失，已按限制停止部署。
- 已确认本地 `cloudbase` / `tcb` CLI 不可用。

## 未完成

- CloudBase 控制台已创建环境 `leader-score-system`，环境 ID `leader-score-system-d9byb5cc6528`，地域上海。
- 已生成 CloudBase 本地代码上传包 `/Users/sonmin/Desktop/leader-score-system-cloudbase.zip`，并确认不包含依赖、构建产物、真实 `.env` 或数据库文件。
- 已记录用户确认的 Staging 配置顺序，不记录任何真实密钥。
- 已判断当前 MySQL 页面为空表是预期状态，业务表后续由 Prisma migration 创建。
- 已确认不应创建外部 MySQL 数据库连接器。
- 已记录 MySQL 非敏感连接字段，未记录密码或完整 `DATABASE_URL`。
- 已记录 COS bucket 非敏感字段和推荐 `COS_PUBLIC_BASE_URL`，未记录任何 COS Secret。
- 已确认服务端 API Key 获取完成，未记录 SecretId / SecretKey。
- 已确认 `SESSION_SECRET` 生成完成，未记录真实值。
- 用户在本地安全位置保存 MySQL password 并组装 `DATABASE_URL`。
- 用户记录 COS env vars: `COS_BUCKET`, `COS_REGION`, `COS_PUBLIC_BASE_URL`。
- CAM API 密钥已获取，后续由用户直接填入 CloudBase 云托管环境变量。
- 用户将 CloudBase 云托管端口映射设置为访问端口 `80`、服务端口 `3000`，目标目录留空，Dockerfile 名称保持 `Dockerfile`。
- 用户在 CloudBase 云托管版本配置中填写或确认 Staging 环境变量。
- 记录 CloudBase 默认访问域名并访问 `/login`。
- 用户在 CloudBase `SQL 编辑器` 执行剪贴板中的 schema 初始化 SQL，保留英文物理表名，随后刷新表列表。
- 用户按 `.codex/CLOUDBASE_FOREIGN_KEYS_AND_MIGRATION_SQL.md` 逐条执行外键约束。
- 用户执行 `_prisma_migrations` 建表和 insert/upsert 记录 SQL。
- 用户按 `.codex/CLOUDBASE_SEED_SQL.md` 执行默认系统账号、默认积分年度、默认积分规则 SQL。
- 默认数据初始化后，用 `admin / 123456` 首次登录并立即修改默认密码或禁用不需要的账号。
- 按 `.codex/CREATE_ADMIN_ACCOUNT_SQL.md` 创建新的后台管理员账号，并在新账号登录成功后禁用默认 seed 账号。
- 登录成功后继续 mvp smoke check 和 COS 上传验收。
- 验收通过后进入 1-3 天小范围内部试运行，试运行期间观察 CloudBase 日志、错误率、数据库写入和图片上传。
- 正式生产运行前完成 `SESSION_SECRET` 轮换、MySQL 备份、COS 私有读 + 后端代理浏览器验收、访问域名/权限策略确认。
- Staging COS 真实上传验收。
- CloudBase 云托管部署验收。
- Web 端完整业务链路验收。
- 用户确认是否接受 CloudBase 私有网络费用，或改用应用和数据库同网络/同平台、轻量代理、公网安全连接加白名单等替代方案。
- 用户打开 CloudBase 默认访问域名 `/login`，用 `admin / 123456` 登录，并确认跳转 `/admin/dashboard`。
- 登录成功后立即修改默认密码或禁用不需要的默认账号。
- 管理端基础页面验收：`/admin/dashboard`、`/admin/score-years`、`/admin/score-rules`、`/admin/data-check`。
- 创建或导入至少 1 条 `Leader` 数据，再验收队长绑定、团期、积分、申请和上传链路。

## 风险

- MySQL migration 生成可能因 SQLite 历史 migration 不兼容，需要 clean migration 方案。
- 本地若没有 Docker/MySQL/COS 凭据，无法完成真实数据库迁移和上传验收。
- CloudBase 控制台配置属于外部操作，只能提供命令和说明，不能在本地完全验证。
- Next 16 默认 Turbopack 在当前中文工作区路径下构建崩溃，已使用 webpack 模式绕过。
- 本地 Docker 不可用，MySQL migrate/seed/smoke 需要在 Staging MySQL 准备好后执行。
- COS URL 校验依赖 `COS_PUBLIC_BASE_URL` 与实际 bucket 公开访问域名一致，Staging 配置时需要重点核对。
- 当前 shell 没有 Staging `DATABASE_URL`、`SESSION_SECRET`、COS 变量、`APP_BASE_URL` 或 `NODE_ENV`，不得继续初始化数据库或部署。
- 本地没有 CloudBase CLI；可改用 CloudBase 控制台部署，或先安装并登录 CLI 后继续。
- 控制台配置时不要把真实密码、SecretKey、Session Secret 或完整含密码的 `DATABASE_URL` 写入 `.codex/`、聊天或提交记录。
- 不要上传整个工作区目录；本地上传应使用 clean zip package，以避免超过 CloudBase 文件数限制或误带本地文件。
- 不要在 CloudBase 控制台手工新建 Prisma 业务表；后续应通过 migration 创建表。
- 不要创建外部 MySQL 数据库连接器，除非后续明确切换为腾讯云独立 MySQL 或其他公网可访问 MySQL。
- MySQL host `172.17.0.13` 是内网地址，本机 Mac 可能不能直连；后续迁移命令可能需要在 CloudBase 可访问该内网地址的环境中执行。
- COS_PUBLIC_BASE_URL 应与服务端 URL 校验配置一致，推荐使用 COS 原生域名而不是 CloudBase 默认域名。
- 云托管环境变量入口不在空服务列表中；若首次本地代码上传流程没有显示环境变量区，应先完成服务基础创建，再进入服务详情的 `新建版本` 或 `服务设置` 补填。
- 云托管服务端口不能保留默认 `80`，必须与 Dockerfile / Next standalone 监听端口 `3000` 一致。
- 当前 Dockerfile 的 runner 阶段只启动 `node server.js`，不会自动运行 Prisma migration 或 seed；部署完成后仍需要单独初始化数据库。
- `/login` 返回 200 只代表页面路由正常，不代表数据库表和默认账号已存在。
- 临时改中文物理表名会打断 Prisma schema、migration、seed 和后续迁移链路；不要在 Staging 初始化时改表名。
- CloudBase SQL 编辑器可能不适合一次运行完整 Prisma 多语句 migration；必要时按建表、索引/外键、迁移记录分段执行。
- 不要重新执行包含 `Evidence` 的剩余 9 表批量 SQL；该批次已在 `SocialPost` 处失败。当前应从 `.codex/CLOUDBASE_REMAINING_TABLE_SQL.md` 的 `HolidayAttendance` 开始逐个执行。
- 业务表已经齐全后，不要直接 seed；必须先补外键约束和 `_prisma_migrations` 记录。
- 默认账号初始密码 `123456` 仅用于 Staging 首次验收；不要长期保留。
- CloudBase 云托管和当前 MySQL 所在网络隔离，继续直连私有 MySQL 可能需要额外收费的私有网络能力；低访问量阶段必须先比较成本再继续。
- 后续任何云服务方案必须提前列出可能收费项，例如私有网络、NAT/固定公网 IP、云数据库、对象存储、带宽、日志、监控、短信/邮件和第三方 API，避免部署中途才发现成本约束。
- 如果切换为“应用和数据库同网络/同平台”，需重新确认数据库连接地址、环境变量、迁移方式和上传存储，但业务代码、Prisma MySQL schema、Dockerfile 和 seed SQL 应尽量复用。
- 私有网络开通后仍要以实际登录为准：`/login` 页面 200 只代表页面可达，`admin / 123456` 登录成功并进入 `/admin/dashboard` 才说明应用容器能读写 MySQL、`SESSION_SECRET` 有效、默认账号数据可用。
- 当前 `Leader` 表为空，队长端、团期、积分生成、排行榜和奖金测算的完整验收需要先准备基础队长和团期数据。

## 2026-07-06 16:36 打包进度

- 当前进度：已从当前工作区生成 CloudBase 控制台本地代码上传 zip，包含 COS 私有读后端代理改动。
- 验收结果：`/Users/sonmin/Desktop/leader-score-system-cloudbase-20260706-1638.zip` 和 `/Users/sonmin/Desktop/leader-score-system-cloudbase.zip` 已生成；包内包含 `Dockerfile`、`.dockerignore`、`package-lock.json`、`prisma/schema.prisma` 和 `app/api/evidence-images/[...key]/route.ts`；包内不包含 `.env`、`.git`、`.codex`、`node_modules`、`.next` 或上传文件。
- 成本说明：本次仅生成本地部署包，不新增云服务或固定付费项；部署后图片代理流量会走 CloudBase 云托管，正式扩大访问量前仍需观察实际流量成本。

## 2026-07-06 18:18 验收完成后的阶段计划

- 当前进度：CloudBase 新版本部署完成；COS 私有读 + 后端登录态图片代理已完成正向和反向验证。
- 第一阶段：发布归档。记录部署包、当前 git diff、验证结论、非敏感环境配置名称和 CloudBase 服务版本；不记录任何密钥。
- 第二阶段：数据安全。完成一次 MySQL 备份或导出，确认恢复路径；确认 COS bucket 仍为私有读写。
- 第三阶段：内部试运行。用 1-3 天小范围真实业务验证登录、队长申请、后台审核、积分写入、图片上传和图片查看。
- 第四阶段：问题收敛。试运行问题按 P0/P1/P2 分级，P0 立即修，P1 试运行结束前修，P2 进入迭代 backlog。
- 第五阶段：生产化评估。根据试运行日志、访问量和成本，再决定正式域名、监控告警、备份周期、账号权限细分和后续功能迭代。
- 成本说明：内部试运行不新增云服务；若正式生产需要自定义域名、监控告警、更高数据库/云托管规格、CDN 鉴权或更长日志存储，必须以当前腾讯云控制台价格为准重新评估。

## 2026-07-06 18:24 本地提交计划

- 当前进度：已创建本地提交 `数据访问私有读写（已验证）`；最终状态记录将 amend 进同一个提交。
- 验收标准：提交前 `git diff --check` 通过；如时间允许复跑 `npm run typecheck`；提交信息为 `数据访问私有读写（已验证）`；提交后 `git status --short` 干净或仅保留明确说明的不提交文件。
- 成本说明：本地 git commit 不新增云服务或付费项。

## 2026-07-07 16:48 试运行操作说明文档

- 当前进度：已新增 `docs/TRIAL_RUN_GUIDE.md`，并通过 `lark-cli docs +create --api-version v2 --doc-format markdown` 创建飞书文档。
- 验收结果：`lark-cli doctor` 通过；`git diff --check` 通过；文档未包含真实密钥、密码、完整 `DATABASE_URL` 或私密图片链接；飞书文档已通过 `lark-cli docs +fetch` 拉取验证内容。
- 成本说明：生成本地 Markdown 和飞书文档不新增云服务；后续试运行仍按 1-3 天小范围执行，暂不扩大范围。

## 2026-07-07 17:07 内测人员操作指南

- 当前进度：已新增 `docs/INTERNAL_TESTER_GUIDE.md`，并通过 `lark-cli docs +create --api-version v2 --doc-format markdown` 创建飞书文档。
- 验收结果：`git diff --check` 通过；文档未包含真实密钥、密码、完整 `DATABASE_URL` 或私密图片链接；飞书文档已通过 `lark-cli docs +fetch` 拉取验证内容。
- 成本说明：生成本地 Markdown 和飞书文档不新增云服务；内测仍按 1-3 天小范围执行，暂不扩大范围。

## 2026-07-07 18:19 合并前备案与桌面主项目合并

- 当前进度：合并前备案、源分支补充提交、GitHub 推送和桌面目标工作树快进合并已完成。
- 执行策略：先在桌面创建带时间戳的备案目录，保存两个工作树 status/log/diff/stat；源分支提交 `.codex` 状态文件和两份 docs 指南；推送 `codex/cloudbase-run-migration` 到 origin；目标工作树 stash `next-env.d.ts` 后执行 `git merge --ff-only codex/cloudbase-run-migration`。
- 验收结果：备案目录 `/Users/sonmin/Desktop/积分系统合并前备案-20260707-182049` 已创建；源分支 `git diff --check` 通过；提交 `6f1c91c docs: add trial run and tester guides` 已创建并推送到 GitHub；桌面目标工作树 fast-forward merge 成功；首次 `npm run typecheck` 因本地缺少 `cos-nodejs-sdk-v5` 失败，运行 `npm install` 后 `npm run typecheck` 通过；`npm run build` 通过。
- 风险说明：目标工作树的 `backups/dev-before-seed-rules-20260522-173824.db` 是本地备份文件，保持未跟踪不提交；`next-env.d.ts` 是本地生成差异，仅 stash，不作为业务提交。
- 成本说明：本次仅执行本地 Git 操作和 GitHub push，不新增云服务或付费资源。

## 2026-08-20 手机号登录与复购姓名调整

- 背景：队长不易记住用户名，需支持注册手机号登录；老队员复购不再强制填写订单号，改为老用户姓名选填。
- 目标：完成登录兼容、独立可空姓名字段、申请/重提/后台/审计/快照改造及本地验收。
- 非目标：本轮不提交、不合并、不部署，不删除历史订单字段。
- 当前代码理解：实现位于 `worktree-fix-review-findings`；`main` 尚未包含本轮及该工作树此前修复。
- 分阶段计划：代码核对与决策 → 小步实现 → Prisma/类型/构建验证 → 隔离 SQLite 兼容运行时验收 → 清理与交付。
- 每阶段验收标准：手机号与后台用户名均可登录；姓名空/非空均可提交并正确持久化；后台正确展示；静态检查通过；临时环境完全清理。
- 当前进度：本地阶段全部完成，状态为 `needs_review`。
- 已完成：代码实现、MySQL migration、Prisma/typecheck/build/diff、浏览器/API/数据库/后台详情/审计验收、临时环境清理。
- 未完成：用户授权后的提交、合并、目标 MySQL 迁移、部署后验收。
- 风险：目标环境必须先迁移再发布；历史 `orderNo` / `approvedOrderKey` 继续只读保留；正式环境仍需复验。
- 恢复说明：先读本节和 `TASK_STATE.md`，检查两个工作树状态，从提交授权或目标迁移开始，不要重复本地实现。

## 2026-08-21 评审修复分支整合执行计划

- 背景：本分支包含两次既有评审提交及手机号登录、复购姓名、migration 和验收状态修改；main 另有本地路径误跟踪清理需求。
- 目标：按清晰提交边界保存修改、两次推送修复分支、合入清理后的 main、全量验证，再供 main 快进。
- 非目标：不执行 CloudBase migration/部署，不删除分支、工作树、备份或历史。
- 分阶段计划：恢复/备案 → 清理验收环境 → 三次提交 → 首次推送 → 合入 main 清理 → 验证 → 再推送 → main 快进与推送。
- 每阶段验收标准：业务文件边界正确、工作区干净、测试全部通过、远端无未知提交、ahead/behind 为 0。
- 当前进度：备案、临时环境清理、拆分提交、首次推送、main 清理和 `.codex` 冲突整合已完成；正在完成 merge commit。
- 已完成：附件与规范核对、远端安全检查、备案、四个修复分支提交、两次首次阶段推送、main 保护/清理提交、双方文档历史整合。
- 未完成：修复分支全量验证和第二次推送、main ff-only、main 最终验证/状态提交/推送。
- 风险：`.codex` 合并可能冲突，必须人工保留双方历史；业务冲突无法安全判断时中止合并。
- 恢复说明：若 merge 未提交，先检查五个 `.codex` 无冲突标记并完成 merge commit；否则从全量验证继续。

## 2026-08-21 队长题库模块整合准备计划

### 背景

- 题库项目已完成本地路线资料、AI 生题、审题、考试链接、答题和结果闭环，但仍使用进程内仓库；其设计 schema 面向 PostgreSQL，并有独立 User/Cookie 和本地 PDF 存储。
- 积分系统已经运行于 MySQL/Prisma 6，具有 User/Leader、角色权限、COS 和 CloudBase 环境。最终目标是把题库作为该系统的新模块，而非长期维护第二个应用。

### 目标

- 最大限度保留题库已验证的领域规则、用例和测试。
- 把会产生二次开发的基础设施差异收敛到 adapters。
- 在正式写 MySQL migration 前确认数据模型和身份映射。
- 不增加未经确认的云资源或固定费用。

### 非目标

- 当前不执行 PostgreSQL 持久化、不迁移生产数据、不部署、不合并仓库、不新增云资源。
- 当前不重做 UI、不扩建独立账号系统、不决定考试是否直接影响积分。

### 当前代码理解

- 题库 `memory-store.ts` 聚合了领域类型、业务用例、身份解析、锁和仓库实现，API 大量直接导入，需先拆边界。
- PostgreSQL schema 使用数组类型和独立 User 关系，不能直接进入积分系统 MySQL schema。
- PDF 解析与本地文件写入绑定；应拆为纯解析和 `DocumentStorage` port，最终实现 COS adapter。
- AI provider 本身可保留 OpenAI-compatible 边界，但其输入类型需脱离内存仓库；任务执行不能在外部 AI 请求期间持有数据库事务或路线锁。
- 积分系统 `Trip` 是具体团期，题库“路线知识库”可能被多个团期复用；不能未经映射直接把两者视为同一实体。

### 分阶段计划与验收标准

1. 决策与映射：完成实体/字段/身份/路由映射表；验收为所有新增表和复用关系都有明确依据，匿名链接模式有明确去留。
2. 原型边界改造：抽出 domain、application、ports 和 memory/local adapters；验收为 API 不直接导入 memory-store，领域代码不依赖 Next/Prisma/React，原 128 项测试及新增契约测试通过。
3. 积分系统模块骨架：使用 `/admin/exams/*`、`/leader/exams/*`、`/api/exams/*` 命名并接现有 auth；验收为不新增 User/Leader 主数据或第二套后台 Cookie。
4. 基础设施适配：在积分系统分支实现 MySQL repository、COS storage 和现有 session adapter；验收为重启恢复、并发保存、幂等提交、权限隔离和资料私有读取通过。
5. 迁移与试运行：小范围导入或重建非生产数据并做真实浏览器 E2E；验收为开始考试、刷新/自动保存、Cookie 丢失分类、服务重启恢复和结果查询通过。

### 当前进度

- 已完成两个项目的代码级对照和开发护栏设计；尚未开始代码改造。

### 已完成

- [x] 确认目标基础设施为积分系统 MySQL/COS/auth/CloudBase。
- [x] 识别 PostgreSQL、身份、本地存储、长锁和路由冲突。
- [x] 形成分阶段验收和成本审批原则。

### 未完成

- [ ] 将决策同步到题库项目状态文件。
- [ ] 完成逻辑数据模型映射表。
- [ ] 完成 ports/adapters 改造及契约测试。
- [ ] 在积分系统分支实现模块和目标 adapters。

### 风险

- 若先实现 PostgreSQL repository、独立后台登录或 S3 worker，后续大概率删除或重写。
- 若把题库 Route 直接映射为 Trip，会丢失“一条知识路线复用于多个实际团期”的能力。
- 若直接复制题库 Prisma schema，MySQL 不支持其中的标量数组设计，且 Prisma 主版本不一致。
- 复用现有云环境不保证完全零增量费用；AI token、COS 容量/流量、数据库容量和云托管计算仍需观察。

### 恢复说明

- 恢复时先读本节和 `.codex/TASK_STATE.md`，检查两个仓库状态；若获准开始，第一步只写数据映射和边界决策，不直接写 migration 或部署。

## 恢复说明

如果中断，下一次必须先读取 `AGENTS.md`、`.codex/TASK_STATE.md`、`.codex/NEXT_ACTIONS.md`、`.codex/DECISIONS.md`、`.codex/WORKLOG.md` 和本文件，运行 `git status --short`，再从 `.codex/NEXT_ACTIONS.md` 第一项未完成任务继续。
