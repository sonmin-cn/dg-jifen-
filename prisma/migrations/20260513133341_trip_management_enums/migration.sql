-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TripLeader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MAIN',
    "actualWorkDays" REAL NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "baseScoreGeneratedAt" DATETIME,
    "baseScoreRecordId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripLeader_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripLeader_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TripLeader" ("actualWorkDays", "baseScoreGeneratedAt", "baseScoreRecordId", "createdAt", "id", "isCompleted", "leaderId", "role", "tripId", "updatedAt") SELECT "actualWorkDays", "baseScoreGeneratedAt", "baseScoreRecordId", "createdAt", "id", "isCompleted", "leaderId", "role", "tripId", "updatedAt" FROM "TripLeader";
DROP TABLE "TripLeader";
ALTER TABLE "new_TripLeader" RENAME TO "TripLeader";
CREATE INDEX "TripLeader_leaderId_isCompleted_idx" ON "TripLeader"("leaderId", "isCompleted");
CREATE UNIQUE INDEX "TripLeader_tripId_leaderId_key" ON "TripLeader"("tripId", "leaderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
