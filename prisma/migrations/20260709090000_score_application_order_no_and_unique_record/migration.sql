-- 复购订单号结构化 + 一申请一积分记录唯一约束
-- 注意：执行前需确认存量 ScoreRecord 中同一 applicationId 没有多条记录，
-- 否则 ScoreRecord_applicationId_key 创建会失败（可先用
-- SELECT applicationId, COUNT(*) FROM ScoreRecord WHERE applicationId IS NOT NULL GROUP BY applicationId HAVING COUNT(*) > 1 核对）。

-- AlterTable
ALTER TABLE `ScoreApplication` ADD COLUMN `approvedOrderKey` VARCHAR(191) NULL,
    ADD COLUMN `orderNo` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ScoreApplication_approvedOrderKey_key` ON `ScoreApplication`(`approvedOrderKey`);

-- CreateIndex
CREATE INDEX `ScoreApplication_orderNo_idx` ON `ScoreApplication`(`orderNo`);

-- CreateIndex
CREATE UNIQUE INDEX `ScoreRecord_applicationId_key` ON `ScoreRecord`(`applicationId`);
