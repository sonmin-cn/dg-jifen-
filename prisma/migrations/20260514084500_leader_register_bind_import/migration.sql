-- AlterTable
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT;
ALTER TABLE "User" ADD COLUMN "lastLoginSource" TEXT;
ALTER TABLE "User" ADD COLUMN "miniProgramOpenId" TEXT;
ALTER TABLE "User" ADD COLUMN "miniProgramUnionId" TEXT;
ALTER TABLE "User" ADD COLUMN "miniProgramUserId" TEXT;

-- CreateTable
CREATE TABLE "LeaderBindRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "leaderPhone" TEXT NOT NULL,
    "realNameInput" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "matchScore" REAL,
    "matchReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaderBindRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaderBindRequest_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Leader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "externalLeaderId" TEXT,
    "miniProgramLeaderId" TEXT,
    "miniProgramPhone" TEXT,
    "realName" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT NOT NULL,
    "region" TEXT,
    "residentLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGULAR',
    "level" TEXT,
    "rawLeaderIdentity" TEXT,
    "rawLeaderLevel" TEXT,
    "rawJobStatus" TEXT,
    "leadCount" INTEGER,
    "leadDays" REAL,
    "auditTime" DATETIME,
    "frozenTime" DATETIME,
    "jobStatus" TEXT,
    "lastImportedAt" DATETIME,
    "sourceSystem" TEXT,
    "joinDate" DATETIME,
    "recommenderLeaderId" TEXT,
    "tags" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Leader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Leader_recommenderLeaderId_fkey" FOREIGN KEY ("recommenderLeaderId") REFERENCES "Leader" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Leader" ("createdAt", "id", "joinDate", "level", "nickname", "phone", "realName", "recommenderLeaderId", "region", "remark", "status", "tags", "updatedAt", "userId") SELECT "createdAt", "id", "joinDate", "level", "nickname", "phone", "realName", "recommenderLeaderId", "region", "remark", "status", "tags", "updatedAt", "userId" FROM "Leader";
DROP TABLE "Leader";
ALTER TABLE "new_Leader" RENAME TO "Leader";
CREATE UNIQUE INDEX "Leader_userId_key" ON "Leader"("userId");
CREATE UNIQUE INDEX "Leader_externalLeaderId_key" ON "Leader"("externalLeaderId");
CREATE UNIQUE INDEX "Leader_phone_key" ON "Leader"("phone");
CREATE INDEX "Leader_status_region_idx" ON "Leader"("status", "region");
CREATE INDEX "Leader_jobStatus_idx" ON "Leader"("jobStatus");
CREATE INDEX "Leader_sourceSystem_idx" ON "Leader"("sourceSystem");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LeaderBindRequest_status_createdAt_idx" ON "LeaderBindRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LeaderBindRequest_userId_status_idx" ON "LeaderBindRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "LeaderBindRequest_leaderId_status_idx" ON "LeaderBindRequest"("leaderId", "status");
