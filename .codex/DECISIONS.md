# Decisions

## 2026-08-17 - 采用可迁移原型先行的答题系统开发顺序

* 决策：推荐先在答题原型中完成并验证业务闭环，再适配为积分系统模块；“原型做好”定义为功能和领域规则可验收，不定义为先建成一套独立生产系统。
* 原因：现有原型已具备考试领域逻辑和 `ExamRepository` 抽象，适合快速验证 PDF、生题、人工审核、组卷、答题和成绩流程；若先实现独立 PostgreSQL、身份、对象存储和云部署，之后切换积分系统 MySQL、登录、COS 和 CloudBase 会重复开发。
* 影响范围：答题原型剩余任务排序、验收标准、未来代码迁移范围和积分系统接入计划。
* 后续注意：原型阶段优先保持领域函数、API 契约、幂等规则和测试稳定；暂缓独立 PostgreSQL 生产仓库、企业微信登录、独立对象存储 worker、独立 CloudBase 服务/VPC/域名。用户确认开始开发后，还需先恢复答题原型项目的真实状态。

## 2026-08-15 - 答题系统优先合并到现有 CloudBase 云托管服务

* 决策：若用户确认实施，答题系统作为 `leader-score-system` 的新业务模块开发，复用现有 CloudBase 环境、同一个云托管服务、MySQL、COS、VPC、域名、登录和 `User/Leader` 数据；首期不新建第二个云托管服务、第二套数据库、独立环境、常驻 worker、云函数或新 VPC。
* 原因：同一环境下新建服务仍会按其实例消耗计算资源；现有答题原型生产持久化未实现且使用 PostgreSQL，与积分系统 Prisma 6/MySQL/认证体系不兼容。模块化合并最能降低固定资源、账号同步、网络和运维成本。
* 影响范围：后续答题模块路由、权限、Prisma MySQL schema、COS 文件目录、CloudBase 部署包和上线验证。
* 后续注意：这是评估推荐，等待用户确认后才实施；不得直接把原型以 `AI_PROVIDER_MODE=fixture` 或内存 repository 部署到生产。

## 2026-08-15 - 零新增费用按“零新增固定资源”控制

* 决策：成本目标定义为“不为答题功能新增第二套固定云资源”；不能承诺无条件的新增账单 0 元。只有现有套餐/资源点余量足够、云托管不额外扩容、MySQL/COS/流量不超额、AI 使用已有额度或不在系统内调用时，现金账单才可能不增加。
* 原因：腾讯云 2026 年当前计费规则将云托管 CPU/内存/外网流量、MySQL 算力/容量、COS 请求/容量/流量和 AI Token 都列为计量资源；AI 生题本质上会消耗按 Token 计费的模型服务。
* 影响范围：CloudBase 套餐用量检查、AI 供应商选择、PDF/题库规模、并发控制、扩缩容和上线预算。
* 后续注意：实施前必须以 CloudBase 控制台当前套餐、资源点余额、近 30 天用量和按量付费开关为准；若发现需要升级规格、购买资源包或开通新付费能力，必须先暂停并征求用户确认。

## 2026-08-15 - 答题模块适配 CloudBase 20MB/60 秒边界

* 决策：首期使用现有 COS 保存不可覆盖的 PDF 版本，MySQL 保存逐页文本和题目/考试记录；PDF 解析和 AI 生题按小批次执行，单请求目标控制在 45–50 秒内，不照搬原型的 50MB 上传与 90 秒 AI 请求设置。
* 原因：CloudBase 云托管当前公开限制为请求包体 20MB、请求超时 60 秒；原型的本地文件写入也不适合无状态、可扩缩容容器。
* 影响范围：PDF 上传流程、COS key、任务幂等、页面进度反馈、AI 请求分页和失败重试。
* 后续注意：若真实资料经常超过首期限额或分批任务仍不稳定，再评估按量云函数/工作流或独立 worker，并在开通前重新做费用评估。

## 2026-07-20 - 20 名队长内测通知口径

* 决策：本轮通知面向 20 名指定队长；每人完成注册、档案绑定、3 条加分申请、图片上传、审核结果查看、积分中心和排行榜检查，并按 P0/P1/P2 反馈问题。
* 原因：用户明确要求生成给 20 名队长的内测通知；现有 `docs/INTERNAL_TESTER_GUIDE.md` 已定义每位队长的建议测试任务和问题分级。
* 影响范围：`docs/INTERNAL_TEST_NOTICE_20_LEADERS.md` 及本轮内测沟通。
* 后续注意：内测日期、反馈渠道、负责人和发布日期尚未提供，通知中保留可替换占位项；不得在通知中写入账号密码、密钥或客户隐私。

## 2026-06-08 - 中断恢复文件作为项目工作入口

* 决策：后续任务必须优先读取 `AGENTS.md` 和 `.codex/` 状态文件，并在关键步骤后更新状态。
* 原因：项目网络环境不稳定，需要支持任意会话从仓库文件恢复。
* 影响范围：所有后续规划、编码、验证、部署任务。
* 后续注意：不得把密钥、token、密码、私密配置或客户隐私数据写入 `.codex/` 文件。

## 2026-06-08 - 暂不实施 CloudBase 迁移

* 决策：CloudBase 云托管 + MySQL 目前只保留为推荐方向，暂不开始代码改造。
* 原因：用户明确表示“先不实施计划”。
* 影响范围：不得新增 Dockerfile、修改 Prisma provider、替换上传存储或执行部署迁移，除非用户再次明确要求。
* 后续注意：如果用户要求继续，先更新 `.codex/TASK_STATE.md` 和 `.codex/NEXT_ACTIONS.md`。

## 2026-06-08 - 开始实施 CloudBase Staging 迁移

* 决策：用户已明确要求实施 CloudBase 迁移计划，先做 Staging 环境准备。
* 原因：用户提供完整执行版计划并要求 `PLEASE IMPLEMENT THIS PLAN`。
* 影响范围：允许新增部署文件、切换 Prisma 到 MySQL、接入 COS SDK、更新环境变量模板和文档。
* 后续注意：仍需保持中断恢复文件，不直接生产上线，不写入任何真实密钥。

## 2026-06-08 - 允许新增腾讯云 COS 官方 SDK

* 决策：证明图片上传迁移允许新增腾讯云 COS 官方 Node SDK 依赖。
* 原因：用户此前选择“允许 COS SDK（推荐）”，且云托管容器本地磁盘不能作为持久上传存储。
* 影响范围：`package.json`, `package-lock.json`, 上传接口和相关存储配置。
* 后续注意：上传接口返回结构保持不变，真实上传验收需要 Staging COS 配置。

## 2026-06-08 - 生产数据应存储在云端 MySQL

* 决策：正式使用场景下，多个队长移动端访问产生的数据应存储在云端 MySQL。
* 原因：SQLite 适合本地开发，不适合作为多人生产访问、云托管多实例、备份恢复和权限管理的正式数据源。
* 影响范围：未来部署方案、数据库迁移方案、小程序 API 数据流。
* 后续注意：默认不迁移当前本地 SQLite 开发数据；若用户确认存在真实业务数据，再设计单独导入流程。

## 2026-06-09 - COS 证明图片 URL 校验边界

* 决策：服务层只接受旧本地 `/uploads/score-applications/` 路径，或 `COS_PUBLIC_BASE_URL` 下的 HTTPS 图片 URL；队长申请限定 `score-applications/` 前缀，专项加分限定 `score-adjustments/` 前缀。
* 原因：上传接口迁移到 COS 后会返回 `https://...` URL，但服务层不能放开任意外部 URL，避免伪造证明图片地址。
* 影响范围：`lib/storage/evidence-url.ts`, `lib/services/score-applications.ts`, `lib/services/score-adjustments.ts`。
* 后续注意：`COS_PUBLIC_BASE_URL` 缺失时不抛错，仅允许旧本地路径；真实 COS 上传仍需 Staging 环境变量验证。

## 2026-06-09 - 积分台账证据展示复用 COS URL 校验

* 决策：积分台账详情页展示证明图片时复用 `isAllowedEvidenceImageUrl`，分别接受积分申请 `score-applications/` 和专项加分 `score-adjustments/` 的合法 COS URL，并继续兼容旧本地路径。
* 原因：Staging 上传和审核成功后，管理员需要在积分台账详情页查看证明图片；展示层不能继续只过滤旧 `/uploads/score-applications/`。
* 影响范围：`app/admin/score-records/[id]/page.tsx`, `lib/storage/evidence-url.ts`。
* 后续注意：如果未来改为私有 COS 或签名 URL，需要同步调整上传返回 URL、校验 helper 和展示逻辑。

## 2026-06-09 - 提交恢复文件和部署准备文件

* 决策：本次 CloudBase 迁移提交包含 `.codex/` 恢复文件、`AGENTS.md`、部署文档、Docker 文件、MySQL migration、COS 存储 helper 和相关最小代码改造。
* 原因：`AGENTS.md` 要求项目支持中断后从仓库文件恢复，Staging 部署也需要可追踪的状态、决策和操作清单。
* 影响范围：提交范围和后续恢复流程。
* 后续注意：真实密钥、`.env`、本地数据库、日志、缓存和临时文件不得提交；Staging Secret 只配置到 CloudBase 云托管环境变量。

## 2026-06-09 - Staging 配置缺失时停止部署

* 决策：当前 Staging 执行因必需环境变量在本地 shell 中缺失而停止，不运行数据库初始化、seed、CloudBase 部署或 Web 验收。
* 原因：用户明确要求变量缺失时停止部署，并禁止打印真实 Secret、连接生产库或执行破坏性操作。
* 影响范围：本次 Staging 初始化与部署验收任务。
* 后续注意：下次继续前只需确认 Staging 变量已在安全终端或 CloudBase 控制台配置完成；不要把真实值写入聊天、`.codex/`、`.env.example` 或提交记录。

## 2026-06-10 - Staging 控制台配置不记录真实密钥

* 决策：CloudBase、MySQL、COS 和 CAM API 密钥先由用户在腾讯云控制台手工创建和配置；Codex 只记录字段名、资源名、地域、端口和非敏感检查结果，不记录真实密码、SecretKey、Session Secret 或完整含密码的连接串。
* 原因：当前任务需要外部控制台操作，且用户明确要求不要把 Secret 发到聊天或提交到 Git。
* 影响范围：`.codex/` 状态文件、部署指导、后续 Staging 验证命令。
* 后续注意：如需本地验证，使用被 `.gitignore` 忽略的 `.env.staging.local` 或仅在当前安全 shell 中临时导出变量。

## 2026-06-10 - Staging 环境采用实际创建名称

* 决策：后续 Staging 配置使用用户已创建的 CloudBase 环境 `leader-score-system`，环境 ID `leader-score-system-d9byb5cc6528`，地域上海。
* 原因：用户已在控制台完成环境创建；虽然名称不同于先前建议的 `leader-score-staging`，但环境 ID 和地域可满足 Staging 配置继续推进。
* 影响范围：CloudBase 云托管、MySQL、COS、环境变量和后续验收记录。
* 后续注意：云托管服务名仍使用 `leader-score-system`；后续记录中不要混淆“环境名称”和“云托管服务名称”。

## 2026-06-10 - CloudBase 本地上传使用 clean git archive

* 决策：CloudBase 本地代码上传使用 `/Users/sonmin/Desktop/leader-score-system-cloudbase.zip`，该包由 `git archive HEAD` 生成。
* 原因：直接上传整个工作目录会包含 `node_modules`、`.next` 等大量文件，触发 CloudBase “上传文件数目不能超过 10000 个”限制，也更容易误带本地私密文件。
* 影响范围：CloudBase 云托管服务创建与后续源码包上传。
* 后续注意：每次代码有新提交后需要重新生成上传包；不要把真实 `.env` 或密钥文件放入上传包。

## 2026-06-10 - Staging 资源配置顺序

* 决策：按用户确认的顺序继续配置：CloudBase 环境已完成；下一步开通 CloudBase MySQL；之后创建 COS bucket、创建或选择 CAM API 密钥、生成 `SESSION_SECRET`，最后填写 CloudBase 云托管环境变量并部署。
* 原因：云托管版本环境变量依赖 MySQL、COS 和安全密钥先就绪；先拿到这些值再创建/发布版本更稳。
* 影响范围：`.codex/NEXT_ACTIONS.md`、后续控制台指导、Staging 部署验收流程。
* 后续注意：只记录字段名和非敏感状态，不记录 MySQL 密码、完整 `DATABASE_URL`、`COS_SECRET_KEY` 或 `SESSION_SECRET`。

## 2026-06-10 - CloudBase 自带 MySQL 表由 Prisma 创建

* 决策：在 CloudBase SQL 型数据库页面不要手工新建业务表；后续通过 Prisma `migrate deploy` 创建应用所需表。
* 原因：当前页面显示 MySQL 实例可访问但表为空，这是预期状态；手工建表会绕过 Prisma migration，容易造成 schema 不一致。
* 影响范围：Staging MySQL 初始化、数据库验收、后续迁移命令。
* 后续注意：`DATABASE_URL` 的 database 部分必须使用控制台实际数据库名；CloudBase 自带 MySQL 可能默认显示为环境 ID，而不是建议名 `leader_score_staging`。

## 2026-06-10 - 不创建外部 MySQL 数据库连接器

* 决策：当前不创建 `新建MySQL数据库连接配置`。
* 原因：该弹窗是用于对接公网 IP/域名可访问的外部或自建 MySQL 数据库连接器；当前 Staging 路线使用 CloudBase 自带 MySQL，并通过 Prisma `DATABASE_URL` 直连数据库。
* 影响范围：CloudBase SQL 型数据库配置、后续 MySQL 连接信息获取。
* 后续注意：应关闭该弹窗，改去 `数据库设置` 查看自带 MySQL 的连接地址、账号和密码/重置入口。

## 2026-06-10 - MySQL 账号密码来源

* 决策：CloudBase 自带 MySQL 的用户名使用控制台 `数据库设置` 显示的默认账号；密码由用户在同页设置或重置后自行保存。
* 原因：不要在外部数据库连接器里自造用户名密码；Prisma 需要的是 CloudBase 自带 MySQL 的真实账号和密码。
* 影响范围：`DATABASE_URL` 组装、CloudBase 云托管环境变量、后续 `migrate deploy`。
* 后续注意：不要把密码或完整 `DATABASE_URL` 写入聊天、`.codex/` 或 git。

## 2026-06-10 - 使用 CloudBase 自动创建的云存储 bucket

* 决策：Staging COS 配置使用当前 CloudBase 环境已有 bucket `6c65-leader-score-system-d9byb5cc6528-1439098102`，地域 `ap-shanghai`，权限为公有读私有写。
* 原因：截图显示该 bucket 已存在、同地域且权限满足 Staging 图片 URL 直接访问验收需求，无需再创建 `leader-score-staging`。
* 影响范围：`COS_BUCKET`, `COS_REGION`, `COS_PUBLIC_BASE_URL`, 后续图片上传验收。
* 后续注意：项目配置优先使用 COS 原生访问域名 `https://6c65-leader-score-system-d9byb5cc6528-1439098102.cos.ap-shanghai.myqcloud.com`；CloudBase 默认域名 `https://6c65-leader-score-system-d9byb5cc6528-1439098102.tcb.qcloud.la` 可作为控制台参考，但不要和 `COS_PUBLIC_BASE_URL` 混填。

## 2026-06-10 - COS 凭据使用服务端 API Key

* 决策：生成或选择服务端 Tencent Cloud / CAM API Key，使用其 `SecretId` 和 `SecretKey` 配置 `COS_SECRET_ID` 与 `COS_SECRET_KEY`；不要使用客户端 Publishable Key。
* 原因：当前代码在 CloudBase 云托管后端 API route 中通过 COS Node SDK 上传文件，需要服务端签名凭据；客户端可公开密钥不适合执行 COS 写入操作，也不能放进前端。
* 影响范围：CAM API 密钥创建、CloudBase 云托管环境变量、COS 上传验收。
* 后续注意：`SecretId` 和 `SecretKey` 只能填到 CloudBase 服务端环境变量或本地安全环境，不发聊天、不写入 git。

## 2026-06-10 - 云托管运行时变量填写位置

* 决策：CloudBase 云托管运行时环境变量在服务创建/新建版本的版本配置中填写，而不是在空的服务列表页直接填写。
* 原因：当前控制台截图显示 `leader-score-system` 环境的云托管服务列表为空，必须先通过 `使用本地代码上传部署` 进入创建服务或版本配置流程。
* 影响范围：CloudBase 云托管服务 `leader-score-system` 的首次创建、后续新版本发布、Staging 变量配置。
* 后续注意：优先在本地代码上传部署流程的 `版本配置` / `高级配置` / `环境变量` 中填写；若首次流程未显示入口，先创建服务，再进入服务详情的 `新建版本` 或 `服务设置` 补填。

## 2026-06-10 - 云托管端口映射

* 决策：CloudBase 云托管端口映射中访问端口保持 `80`，服务端口填写 `3000`。
* 原因：项目 Dockerfile 中 Next standalone 服务监听 `3000`；CloudBase 外部默认 HTTP 访问可通过 `80` 转发到容器内部 `3000`。
* 影响范围：CloudBase 云托管首次部署、健康检查和公网访问。
* 后续注意：不要把服务端口留成默认 `80`，否则容器实际监听端口与云托管转发端口不一致，可能导致访问失败。

## 2026-06-10 - 云托管环境变量使用可视化输入

* 决策：CloudBase 云托管环境变量本次使用 `可视化输入`，逐条填写 key/value。
* 原因：变量包含数据库密码、SecretKey 和 session secret；可视化输入比 JSON 输入更不容易因转义字符出错，也避免通过配置文件落地密钥。
* 影响范围：CloudBase 云托管服务 `leader-score-system` 首次部署的环境变量配置。
* 后续注意：如果控制台自动带出 `CLOUDBASE_APIKEY`，可以保留；不要把 CAM API SecretId/SecretKey 填到 `CLOUDBASE_APIKEY` 里。

## 2026-06-12 - 数据库物理表名保持英文

* 决策：CloudBase MySQL 初始化继续使用 Prisma 现有英文物理表名，例如 `User`、`Leader`、`ScoreRule`、`ScoreYear`、`Trip`。
* 原因：当前 Prisma schema 没有 `@@map`/`@map` 中文表名映射，MySQL 初始 migration 和应用代码/seed 都按英文表名生成；临时改中文表名会导致 Prisma client、外键、索引、seed 和后续 migration 不一致。
* 影响范围：Staging MySQL schema 初始化、后续 Prisma migration、seed、MVP 验收。
* 后续注意：中文业务名称放在 UI 文案、菜单、字段说明和文档中；如未来必须改中文物理表名，需要作为独立数据库重命名改造任务处理。

## 2026-06-12 - CloudBase SQL 编辑器分段执行

* 决策：CloudBase SQL 编辑器初始化 schema 时，先执行单条 `CREATE TABLE User` 测试语句；确认成功后再分段执行后续建表 SQL。
* 原因：用户执行完整 Prisma migration SQL 时，编辑器返回 Error 1064 并指向第一条 `CREATE TABLE User`；分段执行可以排除整段多语句解析问题。
* 影响范围：Staging MySQL 初始化操作方式，不改变 Prisma schema 或物理表名。
* 后续注意：每段 SQL 仍必须来自 `prisma/migrations/20260608142000_init_mysql/migration.sql`，不要在控制台手工改字段、索引或表名。

## 2026-06-13 - 剩余业务表继续单表执行

* 决策：剩余业务表不要再用多表批量 SQL，继续每次只复制并执行一张表。
* 原因：用户执行剩余 9 表批量 SQL 时，CloudBase SQL 编辑器在第二张表 `SocialPost` 处返回 Error 1064；`Evidence` 可能已被第一条语句创建，重复执行整批会带来重复表风险。
* 影响范围：Staging MySQL 手工初始化流程。
* 后续注意：从 `SocialPost` 单表 SQL 继续，后续依次执行 `RepurchaseClaim`、`HolidayAttendance`、`BonusPool`、`BonusSettlement`、`BonusSettlementItem`、`ViolationEvent`、`AuditLog`，最后再执行外键约束和 `_prisma_migrations` 记录。

## 2026-06-14 - 手工建表后先补外键和 Prisma 迁移记录

* 决策：用户确认全部 18 张业务表创建完成后，下一步先执行 Prisma migration 中的 34 条外键约束，再创建并写入 `_prisma_migrations` 记录；完成前不运行 seed。
* 原因：手工建表绕过了 `prisma migrate deploy` 的自动追踪；需要补齐外键和 migration tracking，才能让后续 Prisma 命令识别当前初始化已经完成。
* 影响范围：CloudBase MySQL 初始化、后续 `seed:rules`、Prisma migration 链路和 Staging 验收。
* 后续注意：CloudBase SQL 编辑器继续一次只执行一个代码块；`duplicate constraint` 可跳过，`referenced table missing` 或 `cannot add foreign key` 必须停止排查。

## 2026-06-14 - Staging 默认数据通过 SQL 编辑器初始化

* 决策：外键和 `_prisma_migrations` 完成后，优先通过 `.codex/CLOUDBASE_SEED_SQL.md` 在 CloudBase SQL 编辑器中初始化默认系统账号、默认积分年度和默认积分规则。
* 原因：当前 CloudBase MySQL host 是内网地址，本机未必能直接连接；让用户在控制台执行 SQL 可以继续推进，不需要暴露数据库密码或完整 `DATABASE_URL`。
* 影响范围：Staging 默认数据初始化、首次登录验收和后续安全处理。
* 后续注意：默认账号初始密码为 `123456`，只用于 Staging 首次验收；登录成功后必须尽快修改默认密码或禁用不需要的默认账号。

## 2026-06-14 - 部署方案必须前置评估成本

* 决策：后续选择或调整开发、部署、数据库、存储、网络和第三方服务方案前，必须提前评估新增付费项、费用风险和低成本替代方案，并把结论写入 `AGENTS.md`、`.codex/DECISIONS.md` 或 `.codex/PLANS.md`。
* 原因：当前 CloudBase 云托管访问账号 MySQL 时暴露出网络隔离问题，若继续直连私有 MySQL 可能需要开通收费的私有网络能力；用户明确要求不能部署到一半才发现要开通额外服务。
* 影响范围：后续 CloudBase、MySQL、COS、VPC/私有网络、NAT/固定出口 IP、云服务器、数据库迁移和生产部署选型。
* 后续注意：继续 Staging 或生产部署前，必须先让用户确认当前路线的费用可接受，或改用应用和数据库同网络/同平台、轻量代理、固定出口白名单、公网安全连接等替代方案；价格以当前云厂商控制台或官方价格页为准。

## 2026-06-14 - 暂停盲目推进 CloudBase 私网路线

* 决策：在用户确认是否接受 CloudBase 私有网络费用或选择替代部署拓扑前，不继续把当前 CloudBase 云托管 + 私有 MySQL 直连路线视为默认最终方案。
* 原因：项目预期访问量较低，私有网络费用可能相对不划算；成本是当前方案选型的重要约束。
* 影响范围：默认数据初始化后的登录验收、COS 上传验收、生产部署方案和后续迁移计划。
* 后续注意：已生成的 MySQL schema/seed SQL 可以保留；若切换平台或网络拓扑，优先复用 Prisma MySQL schema、Dockerfile 和 COS 相关代码，避免重做业务功能。

## 2026-07-02 - 私有网络开通后恢复 CloudBase 验收

* 决策：用户已开通私有网络服务，当前继续使用 CloudBase 云托管 + CloudBase MySQL + COS 的 Staging 路线做登录和业务验收。
* 原因：私有网络打通后，最小验证应回到应用实际运行路径：浏览器访问云托管域名、应用容器通过 `DATABASE_URL` 访问 MySQL、登录接口写 session 并读取业务数据。
* 影响范围：Staging 登录验收、默认账号安全处理、管理端基础页面、队长数据初始化、COS 上传验收。
* 后续注意：截图显示 `User` seed 账号已存在、`Leader` 当前为空；登录成功后必须尽快修改默认密码或禁用不需要的默认账号，队长端验收前需要先创建或导入至少 1 条队长档案。

## 2026-07-06 - 新后台管理员账号通过安全哈希 SQL 创建

* 决策：新后台管理员账号通过 CloudBase SQL 编辑器插入 `User` 表创建；密码明文只在用户本机输入，按现有代码规则生成 `pbkdf2_sha512$100000$salt$hash` 后写入 `passwordHash`。
* 原因：当前系统没有明显的后台改密页面或用户管理创建入口；直接使用符合应用校验规则的哈希可以在不暴露明文密码、不改业务代码的前提下完成安全收口。
* 影响范围：后台管理员账号安全、默认 seed 账号禁用、Staging/生产化收口。
* 后续注意：必须先确认新账号能登录后台，再禁用 `admin`、`manager`、`finance`、`viewer`、`product` 等默认 seed 账号；密码、哈希和数据库凭据都不得写入聊天、`.codex/` 或 Git。

## 2026-07-06 - 验收通过后进入小范围内部试运行

* 决策：当前 CloudBase Staging 验收通过后，可以进入小范围内部试运行；不建议在默认账号、暴露密钥、无备份、公有读凭证图片等风险未收口时作为正式生产长期运行。
* 原因：用户报告业务验收通过，且本地 `npm run typecheck`、`npm run build` 均通过；但系统涉及账号、凭证图片、数据库和云服务密钥，生产运行还需要安全和运维收口。
* 影响范围：上线节奏、账号安全、COS 权限、数据库备份、日志监控、后续生产发布计划。
* 后续注意：小范围试运行期间继续使用现有 CloudBase、MySQL、COS 资源，不新增云服务；若正式生产需要私有读图片、日志告警、备份策略、固定域名或更高规格资源，必须先确认当前腾讯云控制台价格和费用可接受。

## 2026-07-06 - COS 凭证图片读取采用后端代理

* 决策：生产图片读取策略采用登录态保护的后端代理 `/api/evidence-images/...`，而不是让浏览器直接访问公有读 COS URL；数据库继续保存原始 COS URL，不做历史数据迁移。
* 原因：凭证图片可能包含敏感业务材料，公有读不适合长期生产；后端代理可以复用当前账号登录态和角色权限，队长只能读取自己档案目录下的申请图片，后台角色可读取申请和专项加分图片。
* 影响范围：COS bucket 可调整为私有读；队长端上传预览、后台审核详情、积分台账详情都改为站内代理图片 URL；云托管会承担图片读取流量。
* 后续注意：该方案不新增云服务或固定费用，但图片流量会经过 CloudBase 云托管，未来图片访问量大时需评估签名 URL、CDN 鉴权或对象生命周期策略；部署本次代码前不要先关闭公有读，否则旧版本页面会破图。

## 2026-07-06 - CloudBase 上传包使用当前工作区内容

* 决策：本次 CloudBase 控制台上传包从当前工作区打包，而不是使用 `git archive HEAD`。
* 原因：当前 COS 私有读后端代理和相关页面改动尚未提交，使用 `git archive HEAD` 会漏掉新路由和未提交源码；当前工作区才是准备部署验证的真实代码状态。
* 影响范围：CloudBase 本地代码上传 zip、云托管新版本部署、COS 私有读图片代理验收。
* 后续注意：打包时必须排除 `.env`、`.git`、`.codex`、`node_modules`、`.next`、`uploads` 和本地缓存；本次打包不新增云服务或额外固定费用，部署前仍需轮换 `SESSION_SECRET`。
## 2026-07-23 - 队长版积分与奖金飞书文档口径

* 决策：飞书文档仅采用 V2.2 正式规则，按“快速摘要—加分—扣分与资格—奖金—常见问题—内测提示”组织；默认配置中 17 条总表外旧版/扩展规则不作为队长正式口径。
* 原因：队长内测需要清晰、唯一、可执行的规则说明，不能把历史配置差异或系统缺陷误写成制度。
* 影响范围：`docs/LEADER_SCORE_AND_BONUS_RULES.md` 和本轮新建的飞书文档。
* 后续注意：有效投诉和安全违规仍按正式制度“年度累计 2 次取消奖金资格”表述；系统若显示资格不一致，作为内测问题反馈并由后台复核，不改变制度口径。

## 2026-08-20 - 队长手机号登录保留后台用户名兼容

* 决策：登录输入为 11 位中国大陆手机号时按 `User.phone` 查询，其他输入按 `User.username` 查询；队长使用手机号，后台人员可继续使用用户名。
* 原因：减少队长记忆用户名的负担，同时不破坏现有后台职能账号。
* 影响范围：截图对应 `worktree-fix-review-findings` 的登录表单、接口、错误提示和审计记录。
* 后续注意：未来支持国际手机号时需扩展格式识别；本轮不改变密码和账号状态规则。

## 2026-08-20 - 老用户姓名为独立可空字段

* 决策：新增 `ScoreApplication.repurchaseCustomerName`；新申请不再要求或写入订单号，也不以姓名做自动唯一查重；历史 `orderNo` / `approvedOrderKey` 保留兼容，订单归属规则由后台结合证明材料人工判断。
* 原因：用户明确要求改为选填姓名，且姓名可能重名，不能沿用订单号唯一键语义。
* 影响范围：截图对应工作树的 Prisma migration、复购申请/重提、后台详情、搜索、审计和积分快照。
* 后续注意：部署前必须先迁移 MySQL；同名老用户允许存在，不能以姓名自动拒绝申请。

## 2026-08-21 - 题库原型最终作为积分系统内置模块

* 决策：队长题库原型不继续按独立生产系统建设；最终形态为积分系统中的 `exams` 模块，复用积分系统 MySQL、Prisma 主版本、`User`/`Leader` 身份、session/权限、COS 和 CloudBase 部署。当前下一阶段先做可迁移化边界改造，不实现独立 PostgreSQL 生产 repository。
* 原因：题库原型当前 PostgreSQL schema、独立 User/Cookie、本地文件存储和 API 路由与积分系统真实栈不一致；先生产化再合并会造成 schema、认证、存储和部署二次开发。
* 影响范围：题库 persistence、domain/application ports、身份映射、PDF 存储、AI 任务、路由命名、UI 集成、测试和部署计划。
* 后续注意：题库业务规则和测试应保留；PostgreSQL `String[]` 等字段需在目标 MySQL 方案中改为 JSON 或子表；管理端和队长身份不能再新建主数据；匿名考试链接是否保留必须作为独立产品决策。

## 2026-08-21 - 题库模块云成本和部署约束

* 决策：优先复用当前 CloudBase、MySQL、COS、网络和登录资源；任何新增 PostgreSQL、数据库实例、worker、VPC/NAT、对象存储、队列、AI 调用额度或服务规格前，必须先列出潜在费用、试运行必要性和低成本替代，并获得用户明确确认。
* 原因：用户目标是不为题库模块单独增加服务器或云环境费用；同一服务器/环境可以复用，但数据库容量、COS 流量、AI 调用和计算资源仍可能按量产生费用，不能把“复用环境”等同于“必然零费用”。
* 影响范围：题库模块生产持久化、文件上传、AI 生题任务、日志监控、容量规划和上线审批。
* 后续注意：费用规则随云厂商变化，进入部署或扩容前必须以腾讯云当前控制台或官方价格页为准；发现新增收费项时暂停实施并说明。

## 2026-08-21 - 评审修复整合与 GitHub 备案边界

* 决策：按用户指定顺序拆分提交、正常推送修复分支、清理 main 误跟踪、在修复分支合并 main、全量验证后让 main 仅以 `--ff-only` 快进并正常推送。
* 原因：保留清晰业务历史、避免丢失修复或本地资料，并保证 origin/main 可审计同步。
* 影响范围：`main`、`worktree-fix-review-findings`、本地保护分支、GitHub 同名远端分支。
* 后续注意：未知远程提交、无法判断的业务冲突、测试失败或数据风险必须停止；不 force、不 rebase、不删除工作树/备份/旧分支，不执行 CloudBase 操作。
