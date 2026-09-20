ALTER TABLE `cars` ADD `is_flood_free` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `cars` ADD `is_accident_free` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE `cars` SET `is_flood_free` = CASE WHEN `has_flood_damage` = 1 THEN 0 ELSE 1 END;
--> statement-breakpoint
UPDATE `cars` SET `is_accident_free` = CASE WHEN `has_accident_damage` = 1 THEN 0 ELSE 1 END;
--> statement-breakpoint
ALTER TABLE `cars` DROP COLUMN `has_flood_damage`;
--> statement-breakpoint
ALTER TABLE `cars` DROP COLUMN `has_accident_damage`;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` ADD `is_flood_free` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` ADD `is_accident_free` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE `trade_in_submissions` SET `is_flood_free` = CASE WHEN `has_flood_damage` = 1 THEN 0 ELSE 1 END;
--> statement-breakpoint
UPDATE `trade_in_submissions` SET `is_accident_free` = CASE WHEN `has_accident_damage` = 1 THEN 0 ELSE 1 END;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` DROP COLUMN `has_flood_damage`;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` DROP COLUMN `has_accident_damage`;
