CREATE TABLE `trade_in_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_city` text NOT NULL,
	`customer_email` text,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`mileage` integer NOT NULL,
	`transmission` text NOT NULL,
	`fuel_type` text,
	`selling_price` integer NOT NULL,
	`bpkb_status` text NOT NULL,
	`stnk_status` text NOT NULL,
	`stnk_tax_expiry` text,
	`has_faktur` integer DEFAULT false NOT NULL,
	`has_service_book` integer DEFAULT false NOT NULL,
	`has_spare_key` integer DEFAULT false NOT NULL,
	`admin_notes` text,
	`has_accident_damage` integer DEFAULT false NOT NULL,
	`has_flood_damage` integer DEFAULT false NOT NULL,
	`condition_notes` text,
	`photos` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trade_in_created_at_idx` ON `trade_in_submissions` (`created_at`);
--> statement-breakpoint
CREATE INDEX `trade_in_customer_phone_idx` ON `trade_in_submissions` (`customer_phone`);