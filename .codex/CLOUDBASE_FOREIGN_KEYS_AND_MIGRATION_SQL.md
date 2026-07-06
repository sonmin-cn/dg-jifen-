# CloudBase Foreign Keys And Prisma Migration SQL

当前进度：18 张业务表已在 CloudBase MySQL 创建完成。

下一步按顺序做两件事：

1. 先执行外键约束。
2. 再创建并写入 `_prisma_migrations` 记录。

执行方式：

1. 进入 CloudBase -> SQL 型数据库 -> SQL 编辑器。
2. 每次只复制一个 SQL 代码块。
3. 先执行「一、外键约束」全部代码块。
4. 全部外键成功后，再执行「二、Prisma 迁移记录」。
5. 如果提示 duplicate constraint / already exists，说明已经执行过，可跳过继续下一条。
6. 如果提示 cannot add foreign key / referenced table missing，先停止，把表名和报错截图发给 Codex。

## 一、外键约束

### 1. Leader_userId_fkey

```sql
ALTER TABLE `Leader` ADD CONSTRAINT `Leader_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 2. Leader_recommenderLeaderId_fkey

```sql
ALTER TABLE `Leader` ADD CONSTRAINT `Leader_recommenderLeaderId_fkey` FOREIGN KEY (`recommenderLeaderId`) REFERENCES `Leader`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 3. LeaderBindRequest_userId_fkey

```sql
ALTER TABLE `LeaderBindRequest` ADD CONSTRAINT `LeaderBindRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

### 4. LeaderBindRequest_leaderId_fkey

```sql
ALTER TABLE `LeaderBindRequest` ADD CONSTRAINT `LeaderBindRequest_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

### 5. TripLeader_tripId_fkey

```sql
ALTER TABLE `TripLeader` ADD CONSTRAINT `TripLeader_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

### 6. TripLeader_leaderId_fkey

```sql
ALTER TABLE `TripLeader` ADD CONSTRAINT `TripLeader_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

### 7. ScoreApplication_scoreYearId_fkey

```sql
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 8. ScoreApplication_leaderId_fkey

```sql
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 9. ScoreApplication_tripId_fkey

```sql
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 10. ScoreApplication_ruleId_fkey

```sql
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `ScoreRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 11. ScoreRecord_scoreYearId_fkey

```sql
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 12. ScoreRecord_leaderId_fkey

```sql
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 13. ScoreRecord_tripId_fkey

```sql
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 14. ScoreRecord_applicationId_fkey

```sql
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `ScoreApplication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 15. ScoreRecord_violationEventId_fkey

```sql
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_violationEventId_fkey` FOREIGN KEY (`violationEventId`) REFERENCES `ViolationEvent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 16. ScoreRecord_ruleId_fkey

```sql
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `ScoreRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 17. SocialPost_applicationId_fkey

```sql
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `ScoreApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

### 18. SocialPost_leaderId_fkey

```sql
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 19. SocialPost_tripId_fkey

```sql
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 20. RepurchaseClaim_applicationId_fkey

```sql
ALTER TABLE `RepurchaseClaim` ADD CONSTRAINT `RepurchaseClaim_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `ScoreApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

### 21. RepurchaseClaim_leaderId_fkey

```sql
ALTER TABLE `RepurchaseClaim` ADD CONSTRAINT `RepurchaseClaim_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 22. RepurchaseClaim_tripId_fkey

```sql
ALTER TABLE `RepurchaseClaim` ADD CONSTRAINT `RepurchaseClaim_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 23. HolidayAttendance_scoreYearId_fkey

```sql
ALTER TABLE `HolidayAttendance` ADD CONSTRAINT `HolidayAttendance_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 24. HolidayAttendance_leaderId_fkey

```sql
ALTER TABLE `HolidayAttendance` ADD CONSTRAINT `HolidayAttendance_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 25. BonusPool_scoreYearId_fkey

```sql
ALTER TABLE `BonusPool` ADD CONSTRAINT `BonusPool_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 26. BonusSettlement_scoreYearId_fkey

```sql
ALTER TABLE `BonusSettlement` ADD CONSTRAINT `BonusSettlement_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 27. BonusSettlement_leaderId_fkey

```sql
ALTER TABLE `BonusSettlement` ADD CONSTRAINT `BonusSettlement_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 28. BonusSettlementItem_settlementId_fkey

```sql
ALTER TABLE `BonusSettlementItem` ADD CONSTRAINT `BonusSettlementItem_settlementId_fkey` FOREIGN KEY (`settlementId`) REFERENCES `BonusSettlement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

### 29. BonusSettlementItem_leaderId_fkey

```sql
ALTER TABLE `BonusSettlementItem` ADD CONSTRAINT `BonusSettlementItem_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 30. ViolationEvent_scoreYearId_fkey

```sql
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 31. ViolationEvent_leaderId_fkey

```sql
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 32. ViolationEvent_tripId_fkey

```sql
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 33. ViolationEvent_ruleId_fkey

```sql
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `ScoreRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

### 34. AuditLog_userId_fkey

```sql
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

## 二、Prisma 迁移记录

所有外键约束执行成功后，再执行下面两个代码块。

### 1. 创建 Prisma 迁移记录表

```sql
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 写入当前 migration 已完成记录

```sql
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES ('00000000-0000-0000-0000-202606081420', 'f775da88a64cb7ed3e6e9bc5b1e73f76d07e0e652b914099cbaced06410a2d64', CURRENT_TIMESTAMP(3), '20260608142000_init_mysql', NULL, NULL, CURRENT_TIMESTAMP(3), 1)
ON DUPLICATE KEY UPDATE `checksum` = VALUES(`checksum`), `finished_at` = VALUES(`finished_at`), `applied_steps_count` = VALUES(`applied_steps_count`);
```
