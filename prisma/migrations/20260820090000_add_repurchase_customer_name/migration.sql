-- 老队员复购申请改为选填老用户姓名；旧订单号字段保留用于历史数据兼容
ALTER TABLE `ScoreApplication`
    ADD COLUMN `repurchaseCustomerName` VARCHAR(191) NULL;

CREATE INDEX `ScoreApplication_repurchaseCustomerName_idx`
    ON `ScoreApplication`(`repurchaseCustomerName`);
