# CloudBase 迁移 SQL：20260709 复购订单号 + 唯一约束

对应迁移：`20260709090000_score_application_order_no_and_unique_record`

执行方式（与之前初始化一致）：

1. 进入 CloudBase -> SQL 型数据库 -> SQL 编辑器，选择 Staging 库。
2. 每次只复制一个 SQL 代码块，按顺序执行。
3. 先执行「〇、前置核对」，两条查询都必须返回空结果才能继续。
4. 如果提示 duplicate column / duplicate key name，说明该块已执行过，跳过继续下一块。
5. 任何其他报错先停止，把报错内容记录下来。

## 〇、前置核对（必须先执行）

### 0.1 同一申请是否有多条积分记录（必须为空）

```sql
SELECT `applicationId`, COUNT(*) AS cnt FROM `ScoreRecord`
WHERE `applicationId` IS NOT NULL
GROUP BY `applicationId` HAVING COUNT(*) > 1;
```

有结果时不要继续：需要先人工确认保留哪条记录，把多余记录作废并把其 `applicationId` 置空后再执行迁移。

### 0.2 确认新列尚未存在（必须为空）

```sql
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ScoreApplication'
  AND COLUMN_NAME IN ('orderNo', 'approvedOrderKey');
```

## 一、结构变更

### 1.1 ScoreApplication 加两列

```sql
ALTER TABLE `ScoreApplication` ADD COLUMN `approvedOrderKey` VARCHAR(191) NULL,
    ADD COLUMN `orderNo` VARCHAR(191) NULL;
```

### 1.2 审核通过订单唯一键

```sql
CREATE UNIQUE INDEX `ScoreApplication_approvedOrderKey_key` ON `ScoreApplication`(`approvedOrderKey`);
```

### 1.3 订单号查重索引

```sql
CREATE INDEX `ScoreApplication_orderNo_idx` ON `ScoreApplication`(`orderNo`);
```

### 1.4 一申请一积分记录唯一约束

```sql
CREATE UNIQUE INDEX `ScoreRecord_applicationId_key` ON `ScoreRecord`(`applicationId`);
```

## 二、写入 Prisma 迁移记录

结构变更全部成功后执行，保证后续 `prisma migrate deploy` / `migrate status` 状态一致：

```sql
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES ('00000000-0000-0000-0000-202607090900', '355bc99edae62e71ffde0b64e7f933d1e04e09ab316bbc01cc8cdefb864215aa', CURRENT_TIMESTAMP(3), '20260709090000_score_application_order_no_and_unique_record', NULL, NULL, CURRENT_TIMESTAMP(3), 1)
ON DUPLICATE KEY UPDATE `checksum` = VALUES(`checksum`), `finished_at` = VALUES(`finished_at`), `applied_steps_count` = VALUES(`applied_steps_count`);
```

## 三、执行后验证

### 3.1 两列已存在（应返回 2 行）

```sql
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ScoreApplication'
  AND COLUMN_NAME IN ('orderNo', 'approvedOrderKey');
```

### 3.2 三个索引已存在（应返回 3 行，前两行 NON_UNIQUE=0）

```sql
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME IN ('ScoreApplication_approvedOrderKey_key', 'ScoreRecord_applicationId_key', 'ScoreApplication_orderNo_idx')
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE;
```

### 3.3 迁移记录已写入（应返回 1 行）

```sql
SELECT `migration_name`, `finished_at` FROM `_prisma_migrations`
WHERE `migration_name` = '20260709090000_score_application_order_no_and_unique_record';
```

全部通过后即可在 CloudBase 云托管上传部署包（先迁移、后部署的顺序不能颠倒）。
