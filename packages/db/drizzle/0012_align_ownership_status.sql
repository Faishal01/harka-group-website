ALTER TABLE `trade_in_submissions` ADD `ownership_status` text;
--> statement-breakpoint
UPDATE `trade_in_submissions` SET `ownership_status` = 'first_hand' WHERE `bpkb_status` = 'on_hand';
--> statement-breakpoint
UPDATE `trade_in_submissions` SET `ownership_status` = 'leasing' WHERE `bpkb_status` = 'leasing';
--> statement-breakpoint
UPDATE `cars` SET `ownership_status` = 'first_hand' WHERE `ownership_status` = 'brand_new';
