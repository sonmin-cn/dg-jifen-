# CloudBase Staging 部署指南

本文记录 CloudBase 云托管 Staging 环境的部署、初始化和验收步骤。本阶段只做测试环境，不直接生产上线，不迁移本地 SQLite 数据。

## 1. 目标架构

- 应用运行在 CloudBase 云托管，服务名建议 `leader-score-system`。
- 数据库使用云端 MySQL，`DATABASE_URL` 使用 MySQL 连接串。
- 证明图片上传到腾讯云 COS，不再写入容器本地磁盘。
- 首次验收先使用 CloudBase 默认访问域名，确认稳定后再绑定正式域名。

## 2. CloudBase / 腾讯云资源

在腾讯云控制台准备：

- CloudBase 环境：建议单独创建 Staging 环境。
- 云托管服务：`leader-score-system`，端口 `3000`。
- MySQL 实例和空数据库：例如 `leader_score_staging`。
- COS bucket：用于积分申请和专项加分证明图片。
- 可选域名：Staging 可先用默认域名，正式域名后续再绑定 HTTPS。

## 3. 云托管环境变量

在 CloudBase 云托管服务中配置以下变量，不要提交真实值到仓库：

```bash
DATABASE_URL="mysql://<user>:<password>@<host>:3306/<database>"
SESSION_SECRET="<long-random-secret>"

COS_SECRET_ID="<secret-id>"
COS_SECRET_KEY="<secret-key>"
COS_BUCKET="<bucket-name-appid>"
COS_REGION="<bucket-region>"
COS_PUBLIC_BASE_URL="https://<bucket-name-appid>.cos.<bucket-region>.myqcloud.com"

WECHAT_APPID="<reserved-mini-program-appid>"
WECHAT_APPSECRET="<reserved-mini-program-appsecret>"
```

COS bucket 如果不是公网读，需要改为使用签名 URL 或 CDN 鉴权；当前实现默认返回 `COS_PUBLIC_BASE_URL` 拼接出的可访问 URL。

## 4. 本地验证

已通过的本地验证：

```bash
DATABASE_URL="mysql://user:password@127.0.0.1:3306/leader_score" npx prisma validate
DATABASE_URL="mysql://user:password@127.0.0.1:3306/leader_score" npm run prisma:generate
npm run typecheck
DATABASE_URL="mysql://user:password@127.0.0.1:3306/leader_score" SESSION_SECRET="build-time-placeholder-secret" npm run build
```

当前本机没有 Docker，未执行本地 MySQL 容器版 `migrate deploy`、`seed:rules` 和 `mvp:check`。这些命令需要在 Staging MySQL 准备好后执行。

## 5. Staging 数据库初始化

CloudBase 和 MySQL 准备好后，在安全终端中执行：

```bash
DATABASE_URL="<staging-mysql-url>" npx prisma migrate deploy
DATABASE_URL="<staging-mysql-url>" npm run seed:rules
DATABASE_URL="<staging-mysql-url>" npm run mvp:check
```

注意：

- `seed:rules` 只同步默认积分规则、默认积分年度和系统账号，不清空业务数据。
- 不要在 Staging / 生产库执行 `seed:test`。
- 默认系统账号初始化后，应尽快修改默认密码或禁用不需要的账号。

## 6. CloudBase 源码部署

建议使用 CloudBase 控制台源码部署：

1. 选择当前仓库或上传代码包。
2. 构建方式选择 Dockerfile。
3. 服务端口填写 `3000`。
4. 部署完成后先访问默认域名的 `/login`。
5. 后续再绑定自定义域名并开启 HTTPS。

本项目 `npm run build` 使用 `next build --webpack`。这是为了避开 Next 16 默认 Turbopack 在中文路径工作区下的构建崩溃；云托管 Docker 路径通常是 ASCII，但保留 webpack build 更稳。

## 7. 验收清单

- `/login` 可打开。
- 使用 seed 管理员账号可登录并跳转后台。
- 可创建或查看队长、团期、积分规则。
- 队长可提交积分申请。
- 管理员可审核积分申请并生成积分记录。
- 队长申请和管理员专项加分的证明图片能上传到 COS，返回 URL 可访问。
- 页面刷新后，已上传图片链接仍可访问。

## 8. 常见问题

- 如果上传返回“图片上传配置缺失，请联系管理员”，检查 COS 环境变量是否完整。
- 如果 `migrate deploy` 无法连接数据库，检查 MySQL 白名单、VPC/内网配置和 `DATABASE_URL`。
- 如果 COS URL 无法访问，检查 bucket 读权限、`COS_PUBLIC_BASE_URL` 和对象 key 是否匹配。
