/*
  Warnings:

  - You are about to drop the column `calculatedBonus` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `cappedBonus` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `convertedTripCount` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `disqualifyReason` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `effectiveTotalPoints` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `finalBonus` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `isQualified` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `rawTotalPoints` on the `BonusSettlement` table. All the data in the column will be lost.
  - You are about to drop the column `secondDistributionBonus` on the `BonusSettlement` table. All the data in the column will be lost.
  - Added the required column `eligibleLeaderCount` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCalculatedAmount` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCappedAmount` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalEligiblePoints` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFinalAmount` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPoolAmount` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `undistributedAmount` to the `BonusSettlement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "BonusSettlementItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalPoints" REAL NOT NULL,
    "baseTripPoints" REAL,
    "applicationPoints" REAL,
    "deductPoints" REAL,
    "tripCount" INTEGER NOT NULL,
    "tripDays" REAL NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "ineligibleReason" TEXT,
    "pointShare" REAL NOT NULL,
    "calculatedAmount" REAL NOT NULL,
    "cappedAmount" REAL NOT NULL,
    "finalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonusSettlementItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "BonusSettlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonusSettlementItem_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BonusPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "month" TEXT,
    "amount" REAL NOT NULL,
    "sourceType" TEXT,
    "title" TEXT NOT NULL DEFAULT '奖金池注入',
    "description" TEXT,
    "injectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonusPool_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BonusPool" ("amount", "createdAt", "createdBy", "id", "month", "remark", "scoreYearId") SELECT "amount", "createdAt", "createdBy", "id", "month", "remark", "scoreYearId" FROM "BonusPool";
DROP TABLE "BonusPool";
ALTER TABLE "new_BonusPool" RENAME TO "BonusPool";
CREATE INDEX "BonusPool_scoreYearId_injectedAt_idx" ON "BonusPool"("scoreYearId", "injectedAt");
CREATE TABLE "new_BonusSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreYearId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalPoolAmount" REAL NOT NULL,
    "eligibleLeaderCount" INTEGER NOT NULL,
    "totalEligiblePoints" REAL NOT NULL,
    "totalCalculatedAmount" REAL NOT NULL,
    "totalFinalAmount" REAL NOT NULL,
    "totalCappedAmount" REAL NOT NULL,
    "undistributedAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "leaderId" TEXT,
    CONSTRAINT "BonusSettlement_scoreYearId_fkey" FOREIGN KEY ("scoreYearId") REFERENCES "ScoreYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonusSettlement_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BonusSettlement" ("createdAt", "id", "leaderId", "scoreYearId", "status", "updatedAt") SELECT "createdAt", "id", "leaderId", "scoreYearId", "status", "updatedAt" FROM "BonusSettlement";
DROP TABLE "BonusSettlement";
ALTER TABLE "new_BonusSettlement" RENAME TO "BonusSettlement";
CREATE INDEX "BonusSettlement_scoreYearId_createdAt_idx" ON "BonusSettlement"("scoreYearId", "createdAt");
CREATE INDEX "BonusSettlement_status_idx" ON "BonusSettlement"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BonusSettlementItem_settlementId_rank_idx" ON "BonusSettlementItem"("settlementId", "rank");

-- CreateIndex
CREATE INDEX "BonusSettlementItem_leaderId_idx" ON "BonusSettlementItem"("leaderId");
