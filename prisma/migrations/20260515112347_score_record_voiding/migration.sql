-- DropIndex
DROP INDEX "ScoreRecord_scoreYearId_sourceType_sourceId_item_key";

-- AlterTable
ALTER TABLE "ScoreRecord" ADD COLUMN "voidReason" TEXT;
ALTER TABLE "ScoreRecord" ADD COLUMN "voidedAt" DATETIME;
ALTER TABLE "ScoreRecord" ADD COLUMN "voidedBy" TEXT;
