-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScoreApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "tripId" TEXT,
    "ruleId" TEXT,
    "ruleCode" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "evidenceText" TEXT,
    "evidenceUrl" TEXT,
    "evidenceJson" TEXT,
    "requestedPoints" REAL NOT NULL,
    "approvedPoints" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payloadJson" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectReason" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreApplication_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreApplication_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreApplication_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScoreApplication_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ScoreRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ScoreApplication" ("approvedPoints", "description", "evidenceJson", "evidenceText", "evidenceUrl", "id", "leaderId", "payloadJson", "rejectReason", "remark", "requestedPoints", "reviewedAt", "reviewedBy", "ruleCode", "ruleId", "scoreYearId", "status", "submittedAt", "title", "tripId", "type") SELECT "approvedPoints", "description", "evidenceJson", "evidenceText", "evidenceUrl", "id", "leaderId", "payloadJson", "rejectReason", "remark", "requestedPoints", "reviewedAt", "reviewedBy", "ruleCode", "ruleId", "scoreYearId", "status", "submittedAt", "title", "tripId", "type" FROM "ScoreApplication";
DROP TABLE "ScoreApplication";
ALTER TABLE "new_ScoreApplication" RENAME TO "ScoreApplication";
CREATE INDEX "ScoreApplication_scoreYearId_status_type_idx" ON "ScoreApplication"("scoreYearId", "status", "type");
CREATE INDEX "ScoreApplication_leaderId_submittedAt_idx" ON "ScoreApplication"("leaderId", "submittedAt");
CREATE INDEX "ScoreApplication_ruleId_idx" ON "ScoreApplication"("ruleId");
CREATE INDEX "ScoreApplication_ruleCode_idx" ON "ScoreApplication"("ruleCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
