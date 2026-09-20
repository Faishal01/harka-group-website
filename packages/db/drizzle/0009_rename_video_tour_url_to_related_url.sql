ALTER TABLE `cars` ADD `related_url` text;
--> statement-breakpoint
UPDATE `cars` SET `related_url` = `video_tour_url`;
--> statement-breakpoint
ALTER TABLE `cars` DROP COLUMN `video_tour_url`;
