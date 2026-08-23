CREATE TABLE `cars` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`image` text,
	`image_alt` text DEFAULT '',
	`gallery` text,
	`video_tour_url` text,
	`excerpt` text,
	`publish_date` integer NOT NULL,
	`general` text NOT NULL,
	`history` text NOT NULL,
	`technical` text NOT NULL,
	`efficiency` text NOT NULL,
	`options` text,
	`security` text,
	`exterior` text NOT NULL,
	`interior` text,
	`misc` text
);
