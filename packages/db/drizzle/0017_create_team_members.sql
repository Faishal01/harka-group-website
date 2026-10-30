CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`photo_url` text,
	`phone` text,
	`email` text,
	`order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `team_members_order_idx` ON `team_members` (`order`);
--> statement-breakpoint
CREATE INDEX `team_members_is_active_idx` ON `team_members` (`is_active`);
