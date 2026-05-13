-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Leader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "realName" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT NOT NULL,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "level" TEXT,
    "joinDate" DATETIME,
    "regularDate" DATETIME,
    "recommenderLeaderId" TEXT,
    "tags" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Leader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Leader_recommenderLeaderId_fkey" FOREIGN KEY ("recommenderLeaderId") REFERENCES "Leader" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "sealDate" DATETIME,
    "status" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeName" TEXT NOT NULL,
    "region" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "tripDays" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "participantCount" INTEGER,
    "productManagerId" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TripLeader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PRIMARY',
    "actualWorkDays" REAL NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "baseScoreGeneratedAt" DATETIME,
    "baseScoreRecordId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripLeader_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripLeader_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "tripId" TEXT,
    "type" TEXT NOT NULL,
    "requestedPoints" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payloadJson" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectReason" TEXT,
    "remark" TEXT,
    CONSTRAINT "ScoreApplication_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreApplication_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreApplication_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "tripId" TEXT,
    "applicationId" TEXT,
    "violationEventId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "rawPoints" REAL NOT NULL,
    "effectivePoints" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EFFECTIVE',
    "occurredAt" DATETIME NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScoreRecord_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreRecord_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreRecord_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScoreRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ScoreApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScoreRecord_violationEventId_fkey" FOREIGN KEY ("violationEventId") REFERENCES "ViolationEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relatedType" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postUrl" TEXT,
    "screenshotUrl" TEXT,
    "postedAt" DATETIME NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "keep7DaysConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "hasRealContent" BOOLEAN NOT NULL DEFAULT false,
    "hasBrandOrRouteInfo" BOOLEAN NOT NULL DEFAULT false,
    "hasPortrait" BOOLEAN NOT NULL DEFAULT false,
    "portraitConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialPost_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ScoreApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialPost_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialPost_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepurchaseClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "oldCustomerName" TEXT NOT NULL,
    "oldCustomerPhoneSuffix" TEXT,
    "orderNo" TEXT NOT NULL,
    "tripId" TEXT,
    "inviteTime" DATETIME NOT NULL,
    "paymentTime" DATETIME NOT NULL,
    "completedTrip" BOOLEAN NOT NULL DEFAULT false,
    "chatEvidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepurchaseClaim_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ScoreApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepurchaseClaim_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepurchaseClaim_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HolidayAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "holidayType" TEXT NOT NULL,
    "submittedAvailable" BOOLEAN NOT NULL DEFAULT false,
    "actuallyAssigned" BOOLEAN NOT NULL DEFAULT false,
    "actuallyCompleted" BOOLEAN NOT NULL DEFAULT false,
    "companyNotAssignedRecognized" BOOLEAN NOT NULL DEFAULT false,
    "recognitionReason" TEXT,
    "approvedBy" TEXT,
    "points" REAL NOT NULL DEFAULT 0,
    "countsForDoubleBonus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HolidayAttendance_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HolidayAttendance_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonusPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdBy" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonusPool_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonusSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "rawTotalPoints" REAL NOT NULL,
    "effectiveTotalPoints" REAL NOT NULL,
    "convertedTripCount" REAL NOT NULL,
    "isQualified" BOOLEAN NOT NULL,
    "disqualifyReason" TEXT,
    "calculatedBonus" REAL NOT NULL,
    "cappedBonus" REAL NOT NULL,
    "secondDistributionBonus" REAL NOT NULL,
    "finalBonus" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BonusSettlement_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonusSettlement_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViolationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "tripId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" REAL NOT NULL,
    "disqualifyBonus" BOOLEAN NOT NULL DEFAULT false,
    "clearPoints" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    CONSTRAINT "ViolationEvent_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViolationEvent_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViolationEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Leader_userId_key" ON "Leader"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Leader_phone_key" ON "Leader"("phone");

-- CreateIndex
CREATE INDEX "Leader_status_region_idx" ON "Leader"("status", "region");

-- CreateIndex
CREATE INDEX "ScoreYear_status_startDate_endDate_idx" ON "ScoreYear"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Trip_status_startDate_idx" ON "Trip"("status", "startDate");

-- CreateIndex
CREATE INDEX "Trip_region_idx" ON "Trip"("region");

-- CreateIndex
CREATE INDEX "TripLeader_leaderId_isCompleted_idx" ON "TripLeader"("leaderId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "TripLeader_tripId_leaderId_role_key" ON "TripLeader"("tripId", "leaderId", "role");

-- CreateIndex
CREATE INDEX "ScoreApplication_scoreYearId_status_type_idx" ON "ScoreApplication"("scoreYearId", "status", "type");

-- CreateIndex
CREATE INDEX "ScoreApplication_leaderId_submittedAt_idx" ON "ScoreApplication"("leaderId", "submittedAt");

-- CreateIndex
CREATE INDEX "ScoreRecord_scoreYearId_leaderId_idx" ON "ScoreRecord"("scoreYearId", "leaderId");

-- CreateIndex
CREATE INDEX "ScoreRecord_status_occurredAt_idx" ON "ScoreRecord"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "ScoreRecord_category_direction_idx" ON "ScoreRecord"("category", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreRecord_scoreYearId_sourceType_sourceId_item_key" ON "ScoreRecord"("scoreYearId", "sourceType", "sourceId", "item");

-- CreateIndex
CREATE INDEX "Evidence_relatedType_relatedId_idx" ON "Evidence"("relatedType", "relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_applicationId_key" ON "SocialPost"("applicationId");

-- CreateIndex
CREATE INDEX "SocialPost_status_postedAt_idx" ON "SocialPost"("status", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_leaderId_tripId_platform_key" ON "SocialPost"("leaderId", "tripId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "RepurchaseClaim_applicationId_key" ON "RepurchaseClaim"("applicationId");

-- CreateIndex
CREATE INDEX "RepurchaseClaim_leaderId_status_idx" ON "RepurchaseClaim"("leaderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RepurchaseClaim_orderNo_key" ON "RepurchaseClaim"("orderNo");

-- CreateIndex
CREATE INDEX "HolidayAttendance_leaderId_countsForDoubleBonus_idx" ON "HolidayAttendance"("leaderId", "countsForDoubleBonus");

-- CreateIndex
CREATE UNIQUE INDEX "HolidayAttendance_scoreYearId_leaderId_holidayType_key" ON "HolidayAttendance"("scoreYearId", "leaderId", "holidayType");

-- CreateIndex
CREATE UNIQUE INDEX "BonusPool_scoreYearId_month_key" ON "BonusPool"("scoreYearId", "month");

-- CreateIndex
CREATE INDEX "BonusSettlement_status_isQualified_idx" ON "BonusSettlement"("status", "isQualified");

-- CreateIndex
CREATE UNIQUE INDEX "BonusSettlement_scoreYearId_leaderId_key" ON "BonusSettlement"("scoreYearId", "leaderId");

-- CreateIndex
CREATE INDEX "ViolationEvent_scoreYearId_leaderId_idx" ON "ViolationEvent"("scoreYearId", "leaderId");

-- CreateIndex
CREATE INDEX "ViolationEvent_status_type_severity_idx" ON "ViolationEvent"("status", "type", "severity");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
