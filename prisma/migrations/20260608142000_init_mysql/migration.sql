-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'LEADER_MANAGER', 'PRODUCT_MANAGER', 'FINANCE', 'ADMIN', 'LEADER', 'EXECUTIVE_VIEWER') NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `authProvider` VARCHAR(191) NULL,
    `miniProgramOpenId` VARCHAR(191) NULL,
    `miniProgramUnionId` VARCHAR(191) NULL,
    `miniProgramUserId` VARCHAR(191) NULL,
    `lastLoginSource` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    INDEX `User_role_status_idx`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Leader` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `externalLeaderId` VARCHAR(191) NULL,
    `miniProgramLeaderId` VARCHAR(191) NULL,
    `miniProgramPhone` VARCHAR(191) NULL,
    `realName` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NULL,
    `residentLocation` VARCHAR(191) NULL,
    `status` ENUM('INTERN', 'REGULAR', 'LEFT', 'SUSPENDED') NOT NULL DEFAULT 'REGULAR',
    `level` VARCHAR(191) NULL,
    `rawLeaderIdentity` VARCHAR(191) NULL,
    `rawLeaderLevel` VARCHAR(191) NULL,
    `rawJobStatus` VARCHAR(191) NULL,
    `leadCount` INTEGER NULL,
    `leadDays` DOUBLE NULL,
    `auditTime` DATETIME(3) NULL,
    `frozenTime` DATETIME(3) NULL,
    `jobStatus` VARCHAR(191) NULL,
    `lastImportedAt` DATETIME(3) NULL,
    `sourceSystem` VARCHAR(191) NULL,
    `joinDate` DATETIME(3) NULL,
    `recommenderLeaderId` VARCHAR(191) NULL,
    `tags` TEXT NULL,
    `remark` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Leader_userId_key`(`userId`),
    UNIQUE INDEX `Leader_externalLeaderId_key`(`externalLeaderId`),
    UNIQUE INDEX `Leader_phone_key`(`phone`),
    INDEX `Leader_status_region_idx`(`status`, `region`),
    INDEX `Leader_jobStatus_idx`(`jobStatus`),
    INDEX `Leader_sourceSystem_idx`(`sourceSystem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaderBindRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `userPhone` VARCHAR(191) NOT NULL,
    `leaderPhone` VARCHAR(191) NOT NULL,
    `realNameInput` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `matchScore` DOUBLE NULL,
    `matchReason` TEXT NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaderBindRequest_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `LeaderBindRequest_userId_status_idx`(`userId`, `status`),
    INDEX `LeaderBindRequest_leaderId_status_idx`(`leaderId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreYear` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `sealDate` DATETIME(3) NULL,
    `status` ENUM('NOT_STARTED', 'ACTIVE', 'SEALED', 'SETTLED') NOT NULL,
    `remark` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScoreYear_status_startDate_endDate_idx`(`status`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreRule` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `category` ENUM('BASE_TRIP', 'HOLIDAY', 'SOCIAL', 'REPURCHASE', 'REFERRAL', 'MENTORSHIP', 'MATERIAL', 'VIOLATION', 'COMPLAINT', 'SAFETY', 'REDLINE', 'MANUAL') NOT NULL,
    `direction` ENUM('ADD', 'DEDUCT') NOT NULL,
    `points` DOUBLE NOT NULL,
    `reviewType` ENUM('AUTO', 'MANUAL_REVIEW', 'MANUAL_RECORD') NOT NULL,
    `triggerType` ENUM('TRIP_COMPLETED', 'SCORE_APPLICATION_APPROVED', 'HOLIDAY_ATTENDANCE_APPROVED', 'VIOLATION_CONFIRMED', 'MANUAL') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effectiveTo` DATETIME(3) NULL,
    `description` TEXT NULL,
    `configJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScoreRule_code_isActive_effectiveFrom_effectiveTo_idx`(`code`, `isActive`, `effectiveFrom`, `effectiveTo`),
    INDEX `ScoreRule_category_direction_idx`(`category`, `direction`),
    UNIQUE INDEX `ScoreRule_code_version_key`(`code`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trip` (
    `id` VARCHAR(191) NOT NULL,
    `routeName` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `tripDays` DOUBLE NOT NULL,
    `status` ENUM('PLANNED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `participantCount` INTEGER NULL,
    `productManagerId` VARCHAR(191) NULL,
    `isHoliday` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Trip_status_startDate_idx`(`status`, `startDate`),
    INDEX `Trip_region_idx`(`region`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TripLeader` (
    `id` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `role` ENUM('MAIN', 'ASSISTANT', 'OTHER') NOT NULL DEFAULT 'MAIN',
    `actualWorkDays` DOUBLE NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `baseScoreGeneratedAt` DATETIME(3) NULL,
    `baseScoreRecordId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TripLeader_leaderId_isCompleted_idx`(`leaderId`, `isCompleted`),
    UNIQUE INDEX `TripLeader_tripId_leaderId_key`(`tripId`, `leaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreApplication` (
    `id` VARCHAR(191) NOT NULL,
    `scoreYearId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NULL,
    `ruleId` VARCHAR(191) NULL,
    `ruleCode` VARCHAR(191) NULL,
    `type` ENUM('MOMENTS_POST', 'XHS_POST', 'WECHAT_MOMENTS', 'XIAOHONGSHU', 'REPURCHASE', 'MENTORSHIP') NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NULL,
    `evidenceText` TEXT NULL,
    `evidenceUrl` TEXT NULL,
    `evidenceJson` TEXT NULL,
    `requestedPoints` DOUBLE NOT NULL,
    `approvedPoints` DOUBLE NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'NEEDS_MORE_INFO') NOT NULL DEFAULT 'PENDING',
    `payloadJson` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectReason` TEXT NULL,
    `remark` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ScoreApplication_scoreYearId_status_type_idx`(`scoreYearId`, `status`, `type`),
    INDEX `ScoreApplication_leaderId_submittedAt_idx`(`leaderId`, `submittedAt`),
    INDEX `ScoreApplication_ruleId_idx`(`ruleId`),
    INDEX `ScoreApplication_ruleCode_idx`(`ruleCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreRecord` (
    `id` VARCHAR(191) NOT NULL,
    `scoreYearId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `violationEventId` VARCHAR(191) NULL,
    `ruleId` VARCHAR(191) NULL,
    `ruleCode` VARCHAR(191) NULL,
    `ruleName` VARCHAR(191) NULL,
    `ruleVersion` INTEGER NULL,
    `rulePoints` DOUBLE NULL,
    `ruleSnapshotJson` TEXT NULL,
    `sourceType` ENUM('TRIP_LEADER', 'APPLICATION', 'HOLIDAY_ATTENDANCE', 'VIOLATION_EVENT', 'MANUAL') NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `category` ENUM('BASE_TRIP', 'HOLIDAY', 'SOCIAL', 'REPURCHASE', 'REFERRAL', 'MENTORSHIP', 'MATERIAL', 'VIOLATION', 'COMPLAINT', 'SAFETY', 'REDLINE', 'MANUAL') NOT NULL,
    `item` VARCHAR(191) NOT NULL,
    `direction` ENUM('ADD', 'DEDUCT') NOT NULL,
    `rawPoints` DOUBLE NOT NULL,
    `effectivePoints` DOUBLE NOT NULL,
    `status` ENUM('EFFECTIVE', 'VOIDED') NOT NULL DEFAULT 'EFFECTIVE',
    `occurredAt` DATETIME(3) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `remark` TEXT NULL,
    `voidReason` TEXT NULL,
    `voidedBy` VARCHAR(191) NULL,
    `voidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScoreRecord_scoreYearId_leaderId_idx`(`scoreYearId`, `leaderId`),
    INDEX `ScoreRecord_ruleId_idx`(`ruleId`),
    INDEX `ScoreRecord_status_occurredAt_idx`(`status`, `occurredAt`),
    INDEX `ScoreRecord_category_direction_idx`(`category`, `direction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evidence` (
    `id` VARCHAR(191) NOT NULL,
    `relatedType` ENUM('SCORE_APPLICATION', 'SCORE_RECORD', 'SOCIAL_POST', 'REPURCHASE_CLAIM', 'HOLIDAY_ATTENDANCE', 'VIOLATION_EVENT') NOT NULL,
    `relatedId` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `fileType` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Evidence_relatedType_relatedId_idx`(`relatedType`, `relatedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialPost` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `platform` ENUM('WECHAT_MOMENTS', 'XIAOHONGSHU') NOT NULL,
    `postUrl` TEXT NULL,
    `screenshotUrl` TEXT NULL,
    `postedAt` DATETIME(3) NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `keep7DaysConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `hasRealContent` BOOLEAN NOT NULL DEFAULT false,
    `hasBrandOrRouteInfo` BOOLEAN NOT NULL DEFAULT false,
    `hasPortrait` BOOLEAN NOT NULL DEFAULT false,
    `portraitConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'VOIDED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SocialPost_applicationId_key`(`applicationId`),
    INDEX `SocialPost_status_postedAt_idx`(`status`, `postedAt`),
    UNIQUE INDEX `SocialPost_leaderId_tripId_platform_key`(`leaderId`, `tripId`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- AddForeignKey
ALTER TABLE `Leader` ADD CONSTRAINT `Leader_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Leader` ADD CONSTRAINT `Leader_recommenderLeaderId_fkey` FOREIGN KEY (`recommenderLeaderId`) REFERENCES `Leader`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaderBindRequest` ADD CONSTRAINT `LeaderBindRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaderBindRequest` ADD CONSTRAINT `LeaderBindRequest_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripLeader` ADD CONSTRAINT `TripLeader_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripLeader` ADD CONSTRAINT `TripLeader_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreApplication` ADD CONSTRAINT `ScoreApplication_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `ScoreRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `ScoreApplication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_violationEventId_fkey` FOREIGN KEY (`violationEventId`) REFERENCES `ViolationEvent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreRecord` ADD CONSTRAINT `ScoreRecord_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `ScoreRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `ScoreApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepurchaseClaim` ADD CONSTRAINT `RepurchaseClaim_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `ScoreApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepurchaseClaim` ADD CONSTRAINT `RepurchaseClaim_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepurchaseClaim` ADD CONSTRAINT `RepurchaseClaim_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HolidayAttendance` ADD CONSTRAINT `HolidayAttendance_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HolidayAttendance` ADD CONSTRAINT `HolidayAttendance_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusPool` ADD CONSTRAINT `BonusPool_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusSettlement` ADD CONSTRAINT `BonusSettlement_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusSettlement` ADD CONSTRAINT `BonusSettlement_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusSettlementItem` ADD CONSTRAINT `BonusSettlementItem_settlementId_fkey` FOREIGN KEY (`settlementId`) REFERENCES `BonusSettlement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusSettlementItem` ADD CONSTRAINT `BonusSettlementItem_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_scoreYearId_fkey` FOREIGN KEY (`scoreYearId`) REFERENCES `ScoreYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Leader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ViolationEvent` ADD CONSTRAINT `ViolationEvent_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `ScoreRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
