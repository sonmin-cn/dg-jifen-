# Create CloudBase Admin Account

本文件用于在 CloudBase SQL 编辑器手动创建新的后台管理员账号。

不要把明文密码、密码哈希、数据库密码或任何密钥写入本文件、聊天或 Git。

## 1. 在本机生成密码哈希

在 Mac 终端执行下面命令。输入密码时终端不会显示字符，这是正常的。

```bash
python3 - <<'PY'
import getpass
import hashlib
import secrets

password = getpass.getpass("New admin password: ")
confirm = getpass.getpass("Confirm password: ")

if password != confirm:
    raise SystemExit("Passwords do not match")

if len(password) < 12:
    raise SystemExit("Use at least 12 characters")

salt = secrets.token_hex(16)
digest = hashlib.pbkdf2_hmac(
    "sha512",
    password.encode("utf-8"),
    salt.encode("utf-8"),
    100000,
    dklen=64,
).hex()

print(f"pbkdf2_sha512$100000${salt}${digest}")
PY
```

把终端输出的整段 `pbkdf2_sha512$100000$...` 暂时复制到剪贴板，下一步只粘贴到 CloudBase SQL 编辑器的 `<paste-password-hash>` 占位符。

## 2. 插入新的后台管理员账号

进入：

CloudBase -> SQL 型数据库 -> SQL 编辑器

复制下面 SQL。执行前只替换尖括号占位符。

```sql
INSERT INTO `User` (
  `id`,
  `username`,
  `name`,
  `phone`,
  `email`,
  `passwordHash`,
  `role`,
  `status`,
  `authProvider`,
  `createdAt`,
  `updatedAt`
)
VALUES (
  CONCAT('user_', REPLACE(UUID(), '-', '')),
  '<new-username>',
  '<display-name>',
  '<unique-phone-or-admin-id>',
  NULL,
  '<paste-password-hash>',
  'SUPER_ADMIN',
  'ACTIVE',
  'PASSWORD',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
);
```

字段建议：

* `<new-username>`：后台登录用户名，建议用英文或拼音，例如 `owner_admin`。
* `<display-name>`：后台显示名，例如 `系统管理员`。
* `<unique-phone-or-admin-id>`：必须唯一。后台账号可以填真实手机号，也可以填唯一编号，例如 `admin-20260706-001`。
* `<paste-password-hash>`：只粘贴第 1 步生成的哈希，不要粘贴明文密码。
* `role`：主账号用 `SUPER_ADMIN`；普通后台管理员可改成 `ADMIN`。

## 3. 查询确认

```sql
SELECT
  `username`,
  `name`,
  `phone`,
  `role`,
  `status`,
  `createdAt`
FROM `User`
WHERE `username` = '<new-username>';
```

## 4. 登录验证

打开 CloudBase 云托管访问域名的 `/login`：

```text
https://<your-cloudbase-domain>/login
```

使用第 2 步填写的 `<new-username>` 和第 1 步输入的明文密码登录。

必须先确认新账号能登录后台，再禁用默认账号。

## 5. 新账号验证成功后禁用默认账号

如果不再需要默认 seed 账号，执行：

```sql
UPDATE `User`
SET
  `status` = 'DISABLED',
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `username` IN ('admin', 'manager', 'finance', 'viewer', 'product');
```

执行后确认状态：

```sql
SELECT `username`, `role`, `status`
FROM `User`
WHERE `username` IN ('admin', 'manager', 'finance', 'viewer', 'product', '<new-username>')
ORDER BY `username`;
```

如果还需要保留 `manager`、`finance` 等分工账号，不要禁用它们；应为每个账号分别生成新密码哈希并更新 `passwordHash`。
