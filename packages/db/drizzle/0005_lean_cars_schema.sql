DROP TABLE IF EXISTS `cars`;
--> statement-breakpoint
CREATE TABLE `cars` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`video_tour_url` text,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`price` integer NOT NULL,
	`year` integer NOT NULL,
	`mileage` integer NOT NULL,
	`body_type` text NOT NULL,
	`fuel_type` text NOT NULL,
	`transmission` text NOT NULL,
	`color` text NOT NULL,
	`horse_power` integer,
	`engine_size_cc` integer,
	`ownership_status` text,
	`has_flood_damage` integer DEFAULT false NOT NULL,
	`has_accident_damage` integer DEFAULT false NOT NULL,
	`tax_expiration_date` integer,
	`seating_capacity` integer,
	`plate_number` text,
	`gallery` text,
	`hidden` integer DEFAULT false NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`archive_reason` text,
	`publish_date` integer NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cars_make_model_idx` ON `cars` (`make`,`model`);
--> statement-breakpoint
CREATE INDEX `cars_price_idx` ON `cars` (`price`);
--> statement-breakpoint
CREATE INDEX `cars_year_idx` ON `cars` (`year`);
--> statement-breakpoint
CREATE INDEX `cars_mileage_idx` ON `cars` (`mileage`);
--> statement-breakpoint
CREATE INDEX `cars_body_type_idx` ON `cars` (`body_type`);
--> statement-breakpoint
CREATE INDEX `cars_fuel_type_idx` ON `cars` (`fuel_type`);
--> statement-breakpoint
CREATE INDEX `cars_ownership_status_idx` ON `cars` (`ownership_status`);
--> statement-breakpoint
CREATE INDEX `cars_deleted_at_idx` ON `cars` (`deleted_at`);
--> statement-breakpoint
CREATE INDEX `cars_publish_date_idx` ON `cars` (`publish_date`);
--> statement-breakpoint
CREATE INDEX `cars_featured_idx` ON `cars` (`featured`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_user_id_idx` ON `session` (`userId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `account_user_id_idx` ON `account` (`userId`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `account_provider_account_idx` ON `account` (`providerId`,`accountId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `verification_identifier_idx` ON `verification` (`identifier`);
