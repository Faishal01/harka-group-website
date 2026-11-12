CREATE TABLE `promos` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`banner_image` text NOT NULL,
	`banner_original_image` text,
	`banner_crop_data` text,
	`mode` text DEFAULT 'filter' NOT NULL,
	`filter_params` text,
	`custom_car_ids` text,
	`is_active` integer DEFAULT true NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promos_slug_unique` ON `promos` (`slug`);
--> statement-breakpoint
CREATE INDEX `promos_is_active_idx` ON `promos` (`is_active`);
--> statement-breakpoint
CREATE INDEX `promos_order_idx` ON `promos` (`order`);
