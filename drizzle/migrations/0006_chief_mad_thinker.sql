PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`content` text NOT NULL,
	`author` text,
	`created_at` integer DEFAULT 1755007359184,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "setting_id", "content", "author", "created_at") SELECT "id", "setting_id", "content", "author", "created_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1755007359184,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_likes`("id", "setting_id", "user_identifier", "created_at") SELECT "id", "setting_id", "user_identifier", "created_at" FROM `likes`;--> statement-breakpoint
DROP TABLE `likes`;--> statement-breakpoint
ALTER TABLE `__new_likes` RENAME TO `likes`;--> statement-breakpoint
CREATE TABLE `__new_post_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` integer DEFAULT 1755007359183,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_tags`("id", "post_id", "tag_id", "created_at") SELECT "id", "post_id", "tag_id", "created_at" FROM `post_tags`;--> statement-breakpoint
DROP TABLE `post_tags`;--> statement-breakpoint
ALTER TABLE `__new_post_tags` RENAME TO `post_tags`;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`content_html` text NOT NULL,
	`norm` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT 1755007359183,
	`updated_at` integer DEFAULT 1755007359183
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "slug", "title", "content", "content_html", "norm", "status", "created_at", "updated_at") SELECT "id", "slug", "title", "content", "content_html", "norm", "status", "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
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
	`created_at` integer DEFAULT 1755007359184
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "game", "role", "dpi", "comment", "fpsExperience", "character", "device", "game_specific_settings", "created_at") SELECT "id", "game", "role", "dpi", "comment", "fpsExperience", "character", "device", "game_specific_settings", "created_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`norm` text NOT NULL,
	`created_at` integer DEFAULT 1755007359183
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "name", "norm", "created_at") SELECT "id", "name", "norm", "created_at" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);