-- CreateTable
CREATE TABLE "ScoreRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "points" REAL NOT NULL,
    "reviewType" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "description" TEXT,
    "configJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScoreRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "tripId" TEXT,
    "applicationId" TEXT,
    "violationEventId" TEXT,
    "ruleId" TEXT,
    "ruleCode" TEXT,
    "ruleName" TEXT,
    "ruleVersion" INTEGER,
    "rulePoints" REAL,
    "ruleSnapshotJson" TEXT,
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
    CONSTRAINT "ScoreRecord_violationEventId_fkey" FOREIGN KEY ("violationEventId") REFERENCES "ViolationEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScoreRecord_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ScoreRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ScoreRecord" ("applicationId", "approvedAt", "approvedBy", "category", "createdAt", "direction", "effectivePoints", "id", "item", "leaderId", "occurredAt", "rawPoints", "remark", "scoreYearId", "sourceId", "sourceType", "status", "tripId", "updatedAt", "violationEventId") SELECT "applicationId", "approvedAt", "approvedBy", "category", "createdAt", "direction", "effectivePoints", "id", "item", "leaderId", "occurredAt", "rawPoints", "remark", "scoreYearId", "sourceId", "sourceType", "status", "tripId", "updatedAt", "violationEventId" FROM "ScoreRecord";
DROP TABLE "ScoreRecord";
ALTER TABLE "new_ScoreRecord" RENAME TO "ScoreRecord";
CREATE INDEX "ScoreRecord_scoreYearId_leaderId_idx" ON "ScoreRecord"("scoreYearId", "leaderId");
CREATE INDEX "ScoreRecord_ruleId_idx" ON "ScoreRecord"("ruleId");
CREATE INDEX "ScoreRecord_status_occurredAt_idx" ON "ScoreRecord"("status", "occurredAt");
CREATE INDEX "ScoreRecord_category_direction_idx" ON "ScoreRecord"("category", "direction");
CREATE UNIQUE INDEX "ScoreRecord_scoreYearId_sourceType_sourceId_item_key" ON "ScoreRecord"("scoreYearId", "sourceType", "sourceId", "item");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ScoreRule_code_isActive_effectiveFrom_effectiveTo_idx" ON "ScoreRule"("code", "isActive", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "ScoreRule_category_direction_idx" ON "ScoreRule"("category", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreRule_code_version_key" ON "ScoreRule"("code", "version");
