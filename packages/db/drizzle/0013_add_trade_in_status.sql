ALTER TABLE `trade_in_submissions` ADD `status` text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` ADD `reviewed_at` integer;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` ADD `reviewed_by` text;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` ADD `converted_car_id` text;
--> statement-breakpoint
CREATE INDEX `trade_in_status_idx` ON `trade_in_submissions` (`status`);
