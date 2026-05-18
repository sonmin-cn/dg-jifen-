/*
  Warnings:

  - Added the required column `updatedAt` to the `ViolationEvent` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ViolationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "tripId" TEXT,
    "ruleId" TEXT,
    "ruleCode" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '违规事件',
    "description" TEXT NOT NULL,
    "evidenceText" TEXT,
    "evidenceUrl" TEXT,
    "remark" TEXT,
    "points" REAL NOT NULL,
    "scoreRecordId" TEXT,
    "disqualifyBonus" BOOLEAN NOT NULL DEFAULT false,
    "clearPoints" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "handledBy" TEXT,
    "approvedBy" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "handledAt" DATETIME,
    "approvedAt" DATETIME,
    CONSTRAINT "ViolationEvent_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViolationEvent_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViolationEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ViolationEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ScoreRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ViolationEvent" ("approvedAt", "approvedBy", "clearPoints", "createdAt", "createdBy", "description", "disqualifyBonus", "id", "leaderId", "points", "scoreYearId", "severity", "status", "tripId", "type") SELECT "approvedAt", "approvedBy", "clearPoints", "createdAt", "createdBy", "description", "disqualifyBonus", "id", "leaderId", "points", "scoreYearId", "severity", "status", "tripId", "type" FROM "ViolationEvent";
DROP TABLE "ViolationEvent";
ALTER TABLE "new_ViolationEvent" RENAME TO "ViolationEvent";
CREATE INDEX "ViolationEvent_scoreYearId_leaderId_idx" ON "ViolationEvent"("scoreYearId", "leaderId");
CREATE INDEX "ViolationEvent_status_type_severity_idx" ON "ViolationEvent"("status", "type", "severity");
CREATE INDEX "ViolationEvent_ruleId_idx" ON "ViolationEvent"("ruleId");
CREATE INDEX "ViolationEvent_ruleCode_idx" ON "ViolationEvent"("ruleCode");
CREATE INDEX "ViolationEvent_occurredAt_idx" ON "ViolationEvent"("occurredAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
