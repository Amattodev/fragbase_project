CREATE TABLE `likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1753748461112,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`content` text NOT NULL,
	`author` text,
	`created_at` integer DEFAULT 1753748461112,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "setting_id", "content", "author", "created_at") SELECT "id", "setting_id", "content", "author", "created_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game` text NOT NULL,
	`role` text NOT NULL,
	`dpi` integer NOT NULL,
	`comment` text,
	`fpsExperience` text DEFAULT '不明' NOT NULL,
	`character` text,
	`device` text,
	`game_specific_settings` text,
	`created_at` integer DEFAULT 1753748461111
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "game", "role", "dpi", "comment", "fpsExperience", "character", "device", "game_specific_settings", "created_at") SELECT "id", "game", "role", "dpi", "comment", "fpsExperience", "character", "device", "game_specific_settings", "created_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;