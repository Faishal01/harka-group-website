ALTER TABLE `admin_whitelist` ADD `role` text DEFAULT 'admin' NOT NULL;
--> statement-breakpoint
ALTER TABLE `admin_whitelist` ADD `created_by` text;
--> statement-breakpoint
UPDATE `admin_whitelist` SET `role` = 'superadmin' WHERE `role` = 'admin';
