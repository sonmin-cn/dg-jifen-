-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Leader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "realName" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT NOT NULL,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGULAR',
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
INSERT INTO "new_Leader" ("createdAt", "id", "joinDate", "level", "nickname", "phone", "realName", "recommenderLeaderId", "region", "regularDate", "remark", "status", "tags", "updatedAt", "userId") SELECT "createdAt", "id", "joinDate", "level", "nickname", "phone", "realName", "recommenderLeaderId", "region", "regularDate", "remark", "status", "tags", "updatedAt", "userId" FROM "Leader";
DROP TABLE "Leader";
ALTER TABLE "new_Leader" RENAME TO "Leader";
CREATE UNIQUE INDEX "Leader_userId_key" ON "Leader"("userId");
CREATE UNIQUE INDEX "Leader_phone_key" ON "Leader"("phone");
CREATE INDEX "Leader_status_region_idx" ON "Leader"("status", "region");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
