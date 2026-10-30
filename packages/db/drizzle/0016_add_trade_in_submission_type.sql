ALTER TABLE `trade_in_submissions` ADD `submission_type` text DEFAULT 'trade_in' NOT NULL;
--> statement-breakpoint
ALTER TABLE `trade_in_submissions` ADD `target_car_id` text;
--> statement-breakpoint
CREATE INDEX `trade_in_submission_type_idx` ON `trade_in_submissions` (`submission_type`);
