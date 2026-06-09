# Decisions

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
