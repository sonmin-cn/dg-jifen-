-- DropIndex
DROP INDEX "ScoreRecord_scoreYearId_sourceType_sourceId_item_key";

-- AlterTable
ALTER TABLE "ScoreRecord" ADD COLUMN "voidReason" TEXT;
ALTER TABLE "ScoreRecord" ADD COLUMN "voidedAt" DATETIME;
ALTER TABLE "ScoreRecord" ADD COLUMN "voidedBy" TEXT;

UPDATE "ScoreRule"
SET "category" = 'COMPLAINT'
WHERE "code" IN ('VALID_COMPLAINT', 'SERIOUS_COMPLAINT');

UPDATE "ScoreRule"
SET "category" = 'SAFETY'
WHERE "code" IN (
    'SAFETY_MISSING_NOTICE',
    'SAFETY_KEY_ACTION_MISSING',
    'INSURANCE_REPORT_DELAY'
);

UPDATE "ScoreRule"
SET "category" = 'REDLINE'
WHERE "code" IN ('REDLINE', 'FAKE_BEHAVIOR');
