# CloudBase Seed SQL

当前用途：在 CloudBase SQL 编辑器里初始化 Staging 默认数据。

前置条件：

1. 18 张业务表已经创建完成。
2. 34 条外键约束已经执行完成。
3. `_prisma_migrations` 已创建并写入 `20260608142000_init_mysql` 记录。

执行顺序：

1. 先执行「默认系统账号」。
2. 再执行「默认积分年度」。
3. 最后执行「默认积分规则」。

注意：

- 默认账号初始密码均为 `123456`，只用于 Staging 首次验收。
- 登录成功后必须尽快修改默认密码，或禁用不需要的账号。
- 本文件不包含 MySQL 密码、COS Secret、Session Secret 或完整 `DATABASE_URL`。
- 如果提示 duplicate key，说明该数据已经存在，通常可以继续下一段。

## 1. 默认系统账号

会创建这些账号：`admin`、`manager`、`finance`、`viewer`、`product`。

```sql
INSERT INTO `User` (`id`, `username`, `name`, `phone`, `passwordHash`, `role`, `status`, `createdAt`, `updatedAt`)
VALUES
('seed_user_admin', 'admin', '超级管理员', '13800000001', 'pbkdf2_sha512$100000$a7774371a551d9d25612eba0925ae233$bc9b5687df85a0706e0352c5105ed79c259427002b5fe80dba7b5d6d9a6e6e04a100b19d531e56070fc859052e514cdbba98340372ed4e6c0f131e156dc4988e', 'SUPER_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_user_manager', 'manager', '队长主管', '13800000002', 'pbkdf2_sha512$100000$496cd01244d169d3256d71f1e782f972$2b5ee8e6e108f735a7be81d35c3bb6127b0c76d9743473b2d2a981f9d28278bb196d4e46efd59e11ce4071cc622eb20810894e3c125c05a75c079fa3b3735ca6', 'LEADER_MANAGER', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_user_finance', 'finance', '财务账号', '13800000004', 'pbkdf2_sha512$100000$e00ba50fb08051f40c1ccd1a1d52f395$5fa994cf63dd6147e729e08cd1b9c5e109263b90e9b632f93170e012f0298dc6ca082552d9b65f5375b50875034fc3398cd9467f05f826ea958b7fa752d94cea', 'FINANCE', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_user_viewer', 'viewer', '只读观察员', '13800000005', 'pbkdf2_sha512$100000$4820df7d1336a5df6b85784a4e12a46b$5076e3f03f6099f9537af04ff9b2ca7c9bb7ff583364e45135b30686acca0b59f01b499c8c0ef1f6c12e83174af6fc27fcb2ca2e590a27fa2b2e10ca92cf7f4d', 'EXECUTIVE_VIEWER', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_user_product', 'product', '产品经理', '13800000006', 'pbkdf2_sha512$100000$d8e41c0a71750a14350600ce53fb41aa$24e0f4d3e5fc2bea87b9a15a4ca6d57e529977e19e0b63b743dffca4cea71d7a89be1ef63b8333658d6ca45351787d3ce56a51d2aaacb6146aababd1c765cf7b', 'PRODUCT_MANAGER', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `username` = VALUES(`username`),
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
```

## 2. 默认积分年度

```sql
INSERT INTO `ScoreYear` (`id`, `name`, `startDate`, `endDate`, `sealDate`, `status`, `remark`, `createdAt`, `updatedAt`)
VALUES ('seed_score_year_2026', '2026年度队长积分', '2025-12-31 16:00:00.000', '2026-12-31 15:59:59.000', '2027-01-15 15:59:59.000', 'ACTIVE', '默认积分年度配置，可在后台积分年度管理中调整', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `startDate` = VALUES(`startDate`),
  `endDate` = VALUES(`endDate`),
  `sealDate` = VALUES(`sealDate`),
  `status` = VALUES(`status`),
  `remark` = VALUES(`remark`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
```

## 3. 默认积分规则

共 42 条规则。

```sql
INSERT INTO `ScoreRule` (`id`, `code`, `name`, `version`, `category`, `direction`, `points`, `reviewType`, `triggerType`, `isActive`, `effectiveFrom`, `effectiveTo`, `description`, `configJson`, `createdAt`, `updatedAt`)
VALUES
('seed_rule_base_trip', 'BASE_TRIP', '基础带队积分', 1, 'BASE_TRIP', 'ADD', 0, 'AUTO', 'TRIP_COMPLETED', 1, '2025-12-31 16:00:00.000', NULL, '完成实际带队后自动计算：1分/团 + 实际带队天数 * 1分/天', '{"formula":"perTripPoints + actualWorkDays * perDayPoints","perTripPoints":1,"perDayPoints":1,"roundActualWorkDays":"CEIL_TO_DAY"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_holiday_mayday_contribution', 'HOLIDAY_MAYDAY_CONTRIBUTION', '五一出勤贡献', 1, 'HOLIDAY', 'ADD', 15, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, '五一满足公司排班要求后的后台确认贡献积分。', '{"holiday":"MAYDAY","points":15,"grantMode":"ADMIN_CONFIRM","requireScheduleCooperation":true,"notAutoBySingleTrip":true,"allowLeaderApplication":false,"requireTrip":false}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_holiday_national_day_contribution', 'HOLIDAY_NATIONAL_DAY_CONTRIBUTION', '国庆出勤贡献', 1, 'HOLIDAY', 'ADD', 15, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, '国庆满足公司排班要求后的后台确认贡献积分。', '{"holiday":"NATIONAL_DAY","points":15,"grantMode":"ADMIN_CONFIRM","requireScheduleCooperation":true,"notAutoBySingleTrip":true,"allowLeaderApplication":false,"requireTrip":false}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_holiday_both_bonus', 'HOLIDAY_BOTH_BONUS', '五一国庆双节额外贡献', 1, 'HOLIDAY', 'ADD', 10, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, '五一和国庆均满足贡献认定后的额外积分。', '{"requiresBothHolidaysSatisfied":true,"includeCompanyNotArrangedButConfirmed":true,"allowLeaderApplication":false,"requireTrip":false}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_holiday_available_not_arranged', 'HOLIDAY_AVAILABLE_NOT_ARRANGED', '节假日可出勤但公司未安排认定', 1, 'HOLIDAY', 'ADD', 10, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, '队长节假日可出勤且配合排班，但公司未安排时的后台认定积分。', '{"grantMode":"ADMIN_CONFIRM","requiresSignupAvailable":true,"requiresNoPickingTrips":true,"canCountTowardBothHolidayBonus":true,"allowLeaderApplication":false,"requireTrip":false}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_moments_trip_share', 'MOMENTS_TRIP_SHARE', '朋友圈带队分享', 1, 'SOCIAL', 'ADD', 3, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '群像照片 + 本次带队/路线相关文字，保留24小时，截图体现发布时间。', '{"allowLeaderApplication":true,"requireTrip":true,"perTripLimit":1,"annualCategoryCap":80,"requiresGroupPhoto":true,"requiresTripRelatedText":true,"requiresPublishTimeScreenshot":true,"keepHours":24}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_moments_daily_promo', 'MOMENTS_DAILY_PROMO', '朋友圈日常分享 / 推广', 1, 'SOCIAL', 'ADD', 1, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '转发招募、活动推文、队长故事、路线推荐、品牌宣传等。', '{"allowLeaderApplication":true,"requireTrip":false,"annualCategoryCap":80,"pureRepostAllowed":true,"requiresPublishTimeScreenshot":true}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_xhs_simple_post', 'XHS_SIMPLE_POST', '小红书简单分享', 1, 'SOCIAL', 'ADD', 3, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '配图 + 行走20岁标签，公开可见，提交链接和截图。', '{"allowLeaderApplication":true,"requireTrip":false,"perTripLimit":1,"annualCategoryCap":80,"requiresPublicLink":true,"requiresImage":true,"requiresBrandTag":true,"exclusiveWith":["XHS_QUALITY_POST"]}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_xhs_quality_post', 'XHS_QUALITY_POST', '小红书要求版分享', 1, 'SOCIAL', 'ADD', 5, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '带队心得或路线分享，正文不少于100字，公开可见。', '{"allowLeaderApplication":true,"requireTrip":false,"perTripLimit":1,"annualCategoryCap":80,"requiresPublicLink":true,"minWords":100,"exclusiveWith":["XHS_SIMPLE_POST"]}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_douyin_video_hearts', 'DOUYIN_VIDEO_HEARTS', '抖音传播', 1, 'SOCIAL', 'ADD', 0, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '每10个小红心5分，单条最高30分，以提交时截图为准。', '{"allowLeaderApplication":true,"requireTrip":false,"pointsPerUnit":5,"unitHearts":10,"maxPointsPerPost":30,"annualCategoryCap":80,"heartCountBased":true,"heartCountSnapshotTiming":"SUBMISSION"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_video_account_hearts', 'VIDEO_ACCOUNT_HEARTS', '视频号传播', 1, 'SOCIAL', 'ADD', 0, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '每10个小红心5分，单条最高30分，以提交时截图为准。', '{"allowLeaderApplication":true,"requireTrip":false,"pointsPerUnit":5,"unitHearts":10,"maxPointsPerPost":30,"annualCategoryCap":80,"heartCountBased":true,"heartCountSnapshotTiming":"SUBMISSION"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_repurchase_completed', 'REPURCHASE_COMPLETED', '老队员复购', 1, 'REPURCHASE', 'ADD', 5, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '老队员完成复购出行，5分/人/次。', '{"allowLeaderApplication":true,"requireTrip":false,"pointsPerPerson":5,"allowRepeatSameMember":true,"oneOrderOneLeader":true,"evidenceRequired":["chatScreenshot","completedTripVerification"]}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_referral_new_leader', 'REFERRAL_NEW_LEADER', '推荐新队长', 1, 'REFERRAL', 'ADD', 10, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, '被推荐人通过培训成为实习队长、完成首次出队并最终转正后给分。', '{"allowLeaderApplication":false,"requireTrip":false,"annualCap":30,"grantWhen":"REFERRED_LEADER_BECOMES_REGULAR"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_mentor_new_leader', 'MENTOR_NEW_LEADER', '带教新人', 1, 'MENTORSHIP', 'ADD', 10, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, '新人完成跟团/出团、双方复盘并最终转正后给分。', '{"allowLeaderApplication":false,"requireTrip":true,"grantWhen":"NEW_LEADER_BECOMES_REGULAR","evidenceRequired":["mentorFeedback","newLeaderReview","tripCompleted","regularConfirmation"]}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_post_trip_feedback', 'POST_TRIP_FEEDBACK', '结团填写反馈', 1, 'MANUAL', 'ADD', 1, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, '结团后48小时内提交有效反馈。', '{"allowLeaderApplication":false,"requireTrip":true,"deadlineHoursAfterTripEnd":48,"requiredSections":["routeIssues","memberFeedback","leaderCollaboration"]}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_post_trip_route_promo', 'POST_TRIP_ROUTE_PROMO', '队长结团总结推广', 1, 'SOCIAL', 'ADD', 2, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '结团后推广行走20岁的其他路线，每团最多1次，可与传播加分重复。', '{"allowLeaderApplication":true,"requireTrip":true,"perTripLimit":1,"canStackWithPromotionPoints":true,"purpose":"PROMOTE_OTHER_ROUTES"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_moments_post', 'MOMENTS_POST', '朋友圈分享', 1, 'SOCIAL', 'ADD', 3, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '出团后朋友圈分享，每团最多 1 次', NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_xhs_post', 'XHS_POST', '小红书笔记', 1, 'SOCIAL', 'ADD', 5, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '出团后小红书笔记，每团最多 1 次', NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_repurchase', 'REPURCHASE', '老队员复购', 1, 'REPURCHASE', 'ADD', 5, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '成功邀请老队员复购，5 分/人', NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_referral_regular', 'REFERRAL_REGULAR', '推荐新队长转正', 1, 'REFERRAL', 'ADD', 10, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '推荐新队长成功转正，年度最高 30 分', '{"yearlyCap":30}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_mentorship', 'MENTORSHIP', '带教新队长', 1, 'MENTORSHIP', 'ADD', 5, 'MANUAL_REVIEW', 'SCORE_APPLICATION_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, '公司指定带教并完成复盘，5 分/人', NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_material_level_2', 'MATERIAL_LEVEL_2', '二档摄影补贴', 1, 'MATERIAL', 'ADD', 3, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_material_level_1', 'MATERIAL_LEVEL_1', '一档摄影补贴', 1, 'MATERIAL', 'ADD', 5, 'MANUAL_RECORD', 'MANUAL', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_may_day_attendance', 'MAY_DAY_ATTENDANCE', '五一实际出队', 1, 'HOLIDAY', 'ADD', 15, 'MANUAL_RECORD', 'HOLIDAY_ATTENDANCE_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_national_day_attendance', 'NATIONAL_DAY_ATTENDANCE', '国庆实际出队', 1, 'HOLIDAY', 'ADD', 15, 'MANUAL_RECORD', 'HOLIDAY_ATTENDANCE_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_double_holiday_bonus', 'DOUBLE_HOLIDAY_BONUS', '双节额外奖励', 1, 'HOLIDAY', 'ADD', 10, 'AUTO', 'HOLIDAY_ATTENDANCE_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_holiday_recognized', 'HOLIDAY_RECOGNIZED', '节假日未安排但认定', 1, 'HOLIDAY', 'ADD', 10, 'MANUAL_REVIEW', 'HOLIDAY_ATTENDANCE_APPROVED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_smoking', 'SMOKING', '带团期间抽烟', 1, 'VIOLATION', 'DEDUCT', 20, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, '带团期间在队员面前或公共场景抽烟', NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_uniform_missing', 'UNIFORM_MISSING', '集合日未穿队服', 1, 'VIOLATION', 'DEDUCT', 5, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_slipper', 'SLIPPER', '穿拖鞋等形象不符', 1, 'VIOLATION', 'DEDUCT', 5, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_late', 'LATE', '队长集合迟到', 1, 'VIOLATION', 'DEDUCT', 20, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_waiting_over_10_min', 'WAITING_OVER_10_MIN', '组织不当等待超过10分钟', 1, 'VIOLATION', 'DEDUCT', 10, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_missing_equipment', 'MISSING_EQUIPMENT', '未带基础物资', 1, 'VIOLATION', 'DEDUCT', 5, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_ignore_members', 'IGNORE_MEMBERS', '队长扎堆忽视队员', 1, 'VIOLATION', 'DEDUCT', 10, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_valid_complaint', 'VALID_COMPLAINT', '有效投诉', 1, 'COMPLAINT', 'DEDUCT', 15, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, '经后台核实成立的服务、组织、沟通、照顾队员等问题投诉。', '{"disqualifyBonusWhenAnnualCountGte":2,"appealDeadlineWorkdays":3}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_serious_complaint', 'SERIOUS_COMPLAINT', '严重投诉', 1, 'COMPLAINT', 'DEDUCT', 0, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, '同团3名及以上有效投诉同一队长，或单个重大事件。', '{"clearAnnualPoints":true,"clearPoints":true,"disqualifyBonus":true,"definition":"同团3名及以上有效投诉同一队长，或单个重大事件","appealDeadlineWorkdays":3}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_safety_violation', 'SAFETY_VIOLATION', '安全违规', 1, 'SAFETY', 'DEDUCT', 30, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, '未做中高风险安全告知、未录视频留证、未提醒救生衣、未及时保险报备或擅自组织高风险活动。', '{"disqualifyBonusWhenAnnualCountGte":2,"appealDeadlineWorkdays":3}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_safety_missing_notice', 'SAFETY_MISSING_NOTICE', '安全告知缺失', 1, 'SAFETY', 'DEDUCT', 30, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_safety_key_action_missing', 'SAFETY_KEY_ACTION_MISSING', '关键安全动作缺失', 1, 'SAFETY', 'DEDUCT', 30, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_insurance_report_delay', 'INSURANCE_REPORT_DELAY', '出险报备延误', 1, 'SAFETY', 'DEDUCT', 30, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_redline', 'REDLINE', '红线行为', 1, 'REDLINE', 'DEDUCT', 0, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, '积分清零并取消奖金资格', '{"clearAnnualPoints":true,"clearPoints":true,"disqualifyBonus":true,"followOriginalPolicy":true,"appealDeadlineWorkdays":3}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('seed_rule_fake_behavior', 'FAKE_BEHAVIOR', '虚假行为', 1, 'REDLINE', 'DEDUCT', 0, 'MANUAL_REVIEW', 'VIOLATION_CONFIRMED', 1, '2025-12-31 16:00:00.000', NULL, '积分清零并取消奖金资格', '{"clearAnnualPoints":true,"clearPoints":true,"disqualifyBonus":true,"appealDeadlineWorkdays":3}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `direction` = VALUES(`direction`),
  `points` = VALUES(`points`),
  `reviewType` = VALUES(`reviewType`),
  `triggerType` = VALUES(`triggerType`),
  `isActive` = VALUES(`isActive`),
  `effectiveFrom` = VALUES(`effectiveFrom`),
  `effectiveTo` = VALUES(`effectiveTo`),
  `description` = VALUES(`description`),
  `configJson` = VALUES(`configJson`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
```
