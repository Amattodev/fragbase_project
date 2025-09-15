PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`content` text NOT NULL,
	`author` text,
	`created_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "setting_id", "content", "author", "created_at") SELECT "id", "setting_id", "content", "author", "created_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_game_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer DEFAULT 1757438240244
);
--> statement-breakpoint
INSERT INTO `__new_game_categories`("id", "name", "display_name", "created_at") SELECT "id", "name", "display_name", "created_at" FROM `game_categories`;--> statement-breakpoint
DROP TABLE `game_categories`;--> statement-breakpoint
ALTER TABLE `__new_game_categories` RENAME TO `game_categories`;--> statement-breakpoint
CREATE UNIQUE INDEX `game_categories_name_unique` ON `game_categories` (`name`);--> statement-breakpoint
CREATE TABLE `__new_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_likes`("id", "setting_id", "user_identifier", "created_at") SELECT "id", "setting_id", "user_identifier", "created_at" FROM `likes`;--> statement-breakpoint
DROP TABLE `likes`;--> statement-breakpoint
ALTER TABLE `__new_likes` RENAME TO `likes`;--> statement-breakpoint
CREATE TABLE `__new_post_comment_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`comment_id`) REFERENCES `post_comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_comment_likes`("id", "comment_id", "user_identifier", "created_at") SELECT "id", "comment_id", "user_identifier", "created_at" FROM `post_comment_likes`;--> statement-breakpoint
DROP TABLE `post_comment_likes`;--> statement-breakpoint
ALTER TABLE `__new_post_comment_likes` RENAME TO `post_comment_likes`;--> statement-breakpoint
CREATE TABLE `__new_post_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`parent_id` integer,
	`content` text NOT NULL,
	`author` text,
	`user_identifier` text,
	`created_at` integer DEFAULT 1757438240244,
	`updated_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_comments`("id", "post_id", "parent_id", "content", "author", "user_identifier", "created_at", "updated_at") SELECT "id", "post_id", "parent_id", "content", "author", "user_identifier", "created_at", "updated_at" FROM `post_comments`;--> statement-breakpoint
DROP TABLE `post_comments`;--> statement-breakpoint
ALTER TABLE `__new_post_comments` RENAME TO `post_comments`;--> statement-breakpoint
CREATE TABLE `__new_post_game_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`game_category_id` integer NOT NULL,
	`created_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_category_id`) REFERENCES `game_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_game_categories`("id", "post_id", "game_category_id", "created_at") SELECT "id", "post_id", "game_category_id", "created_at" FROM `post_game_categories`;--> statement-breakpoint
DROP TABLE `post_game_categories`;--> statement-breakpoint
ALTER TABLE `__new_post_game_categories` RENAME TO `post_game_categories`;--> statement-breakpoint
CREATE TABLE `__new_post_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_likes`("id", "post_id", "user_identifier", "created_at") SELECT "id", "post_id", "user_identifier", "created_at" FROM `post_likes`;--> statement-breakpoint
DROP TABLE `post_likes`;--> statement-breakpoint
ALTER TABLE `__new_post_likes` RENAME TO `post_likes`;--> statement-breakpoint
CREATE TABLE `__new_post_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` integer DEFAULT 1757438240244,
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
	`user_id` text,
	`created_at` integer DEFAULT 1757438240244,
	`updated_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "slug", "title", "content", "content_html", "norm", "status", "user_id", "created_at", "updated_at") SELECT "id", "slug", "title", "content", "content_html", "norm", "status", "user_id", "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
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
	`created_at` integer DEFAULT 1757438240244
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "game", "role", "dpi", "comment", "fpsExperience", "character", "device", "game_specific_settings", "created_at") SELECT "id", "game", "role", "dpi", "comment", "fpsExperience", "character", "device", "game_specific_settings", "created_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`norm` text NOT NULL,
	`created_at` integer DEFAULT 1757438240244
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "name", "norm", "created_at") SELECT "id", "name", "norm", "created_at" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `__new_user_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`bio` text,
	`social_links` text,
	`custom_fields` text,
	`created_at` integer DEFAULT 1757438240244,
	`updated_at` integer DEFAULT 1757438240244,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_profiles`("id", "user_id", "bio", "social_links", "custom_fields", "created_at", "updated_at") SELECT "id", "user_id", "bio", "social_links", "custom_fields", "created_at", "updated_at" FROM `user_profiles`;--> statement-breakpoint
DROP TABLE `user_profiles`;--> statement-breakpoint
ALTER TABLE `__new_user_profiles` RENAME TO `user_profiles`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);