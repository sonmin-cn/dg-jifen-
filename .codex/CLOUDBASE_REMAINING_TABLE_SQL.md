# CloudBase Remaining Table SQL

按顺序每次只复制一个代码块到 CloudBase SQL 编辑器执行。

如果某张表提示 already exists / 表已存在，跳过该表，继续下一张。

当前进度：用户已确认 18 张业务表全部创建完成；本文件仅作为建表历史参考。下一步请改用 `.codex/CLOUDBASE_FOREIGN_KEYS_AND_MIGRATION_SQL.md` 执行外键约束和 `_prisma_migrations` 记录。

## RepurchaseClaim

```sql
CREATE TABLE `RepurchaseClaim` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `oldCustomerName` VARCHAR(191) NOT NULL,
    `oldCustomerPhoneSuffix` VARCHAR(191) NULL,
    `orderNo` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NULL,
    `inviteTime` DATETIME(3) NOT NULL,
    `paymentTime` DATETIME(3) NOT NULL,
    `completedTrip` BOOLEAN NOT NULL DEFAULT false,
    `chatEvidenceUrl` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CONFLICTED', 'VOIDED') NOT NULL DEFAULT 'PENDING',
    `rejectReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RepurchaseClaim_applicationId_key`(`applicationId`),
    INDEX `RepurchaseClaim_leaderId_status_idx`(`leaderId`, `status`),
    UNIQUE INDEX `RepurchaseClaim_orderNo_key`(`orderNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## HolidayAttendance

```sql
CREATE TABLE `HolidayAttendance` (
    `id` VARCHAR(191) NOT NULL,
    `scoreYearId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `holidayType` ENUM('MAY_DAY', 'NATIONAL_DAY') NOT NULL,
    `submittedAvailable` BOOLEAN NOT NULL DEFAULT false,
    `actuallyAssigned` BOOLEAN NOT NULL DEFAULT false,
    `actuallyCompleted` BOOLEAN NOT NULL DEFAULT false,
    `companyNotAssignedRecognized` BOOLEAN NOT NULL DEFAULT false,
    `recognitionReason` TEXT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `points` DOUBLE NOT NULL DEFAULT 0,
    `countsForDoubleBonus` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HolidayAttendance_leaderId_countsForDoubleBonus_idx`(`leaderId`, `countsForDoubleBonus`),
    UNIQUE INDEX `HolidayAttendance_scoreYearId_leaderId_holidayType_key`(`scoreYearId`, `leaderId`, `holidayType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## BonusPool

```sql
CREATE TABLE `BonusPool` (
    `id` VARCHAR(191) NOT NULL,
    `scoreYearId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `sourceType` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '奖金池注入',
    `description` TEXT NULL,
    `injectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    `remark` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BonusPool_scoreYearId_injectedAt_idx`(`scoreYearId`, `injectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## BonusSettlement

```sql
CREATE TABLE `BonusSettlement` (
    `id` VARCHAR(191) NOT NULL,
    `scoreYearId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `totalPoolAmount` DOUBLE NOT NULL,
    `eligibleLeaderCount` INTEGER NOT NULL,
    `totalEligiblePoints` DOUBLE NOT NULL,
    `totalCalculatedAmount` DOUBLE NOT NULL,
    `totalFinalAmount` DOUBLE NOT NULL,
    `totalCappedAmount` DOUBLE NOT NULL,
    `undistributedAmount` DOUBLE NOT NULL,
    `status` ENUM('DRAFT', 'CONFIRMED', 'LOCKED') NOT NULL DEFAULT 'DRAFT',
    `remark` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `leaderId` VARCHAR(191) NULL,

    INDEX `BonusSettlement_scoreYearId_createdAt_idx`(`scoreYearId`, `createdAt`),
    INDEX `BonusSettlement_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## BonusSettlementItem

```sql
CREATE TABLE `BonusSettlementItem` (
    `id` VARCHAR(191) NOT NULL,
    `settlementId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `totalPoints` DOUBLE NOT NULL,
    `baseTripPoints` DOUBLE NULL,
    `applicationPoints` DOUBLE NULL,
    `deductPoints` DOUBLE NULL,
    `tripCount` INTEGER NOT NULL,
    `tripDays` DOUBLE NOT NULL,
    `eligible` BOOLEAN NOT NULL,
    `ineligibleReason` TEXT NULL,
    `pointShare` DOUBLE NOT NULL,
    `calculatedAmount` DOUBLE NOT NULL,
    `cappedAmount` DOUBLE NOT NULL,
    `finalAmount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BonusSettlementItem_settlementId_rank_idx`(`settlementId`, `rank`),
    INDEX `BonusSettlementItem_leaderId_idx`(`leaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## ViolationEvent

```sql
CREATE TABLE `ViolationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `scoreYearId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NULL,
    `ruleId` VARCHAR(191) NULL,
    `ruleCode` VARCHAR(191) NOT NULL DEFAULT '',
    `type` ENUM('GENERAL', 'COMPLAINT', 'SAFETY', 'REDLINE', 'FAKE_BEHAVIOR') NOT NULL,
    `severity` ENUM('MINOR', 'NORMAL', 'SERIOUS', 'CRITICAL') NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '违规事件',
    `description` TEXT NOT NULL,
    `evidenceText` TEXT NULL,
    `evidenceUrl` TEXT NULL,
    `remark` TEXT NULL,
    `points` DOUBLE NOT NULL,
    `scoreRecordId` VARCHAR(191) NULL,
    `disqualifyBonus` BOOLEAN NOT NULL DEFAULT false,
    `clearPoints` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'EFFECTIVE', 'REVOKED') NOT NULL DEFAULT 'DRAFT',
    `createdBy` VARCHAR(191) NOT NULL,
    `handledBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `handledAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,

    INDEX `ViolationEvent_scoreYearId_leaderId_idx`(`scoreYearId`, `leaderId`),
    INDEX `ViolationEvent_status_type_severity_idx`(`status`, `type`, `severity`),
    INDEX `ViolationEvent_ruleId_idx`(`ruleId`),
    INDEX `ViolationEvent_ruleCode_idx`(`ruleCode`),
    INDEX `ViolationEvent_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## AuditLog

```sql
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `beforeJson` TEXT NULL,
    `afterJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `AuditLog_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
