CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`content` text NOT NULL,
	`author` text,
	`created_at` integer DEFAULT 1751798286191,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game` text NOT NULL,
	`role` text NOT NULL,
	`dpi` integer NOT NULL,
	`comment` text,
	`fpsExperience` text DEFAULT '不明' NOT NULL,
	`character` text,
	`device` text,
	`game_specific_settings` text,
	`created_at` integer DEFAULT 1751798286191
);
--> statement-breakpoint
DROP TABLE `files`;