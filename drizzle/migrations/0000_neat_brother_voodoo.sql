CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_providerAccountId_unique` ON `account` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`content` text NOT NULL,
	`author` text,
	`created_at` integer DEFAULT 1757344561088,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer DEFAULT 1757344561087
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_categories_name_unique` ON `game_categories` (`name`);--> statement-breakpoint
CREATE TABLE `likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1757344561088,
	FOREIGN KEY (`setting_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_comment_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1757344561088,
	FOREIGN KEY (`comment_id`) REFERENCES `post_comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`parent_id` integer,
	`content` text NOT NULL,
	`author` text,
	`user_identifier` text,
	`created_at` integer DEFAULT 1757344561088,
	`updated_at` integer DEFAULT 1757344561088,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_game_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`game_category_id` integer NOT NULL,
	`created_at` integer DEFAULT 1757344561088,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_category_id`) REFERENCES `game_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`created_at` integer DEFAULT 1757344561088,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` integer DEFAULT 1757344561087,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`content_html` text NOT NULL,
	`norm` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`user_id` text,
	`created_at` integer DEFAULT 1757344561087,
	`updated_at` integer DEFAULT 1757344561087,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
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
	`created_at` integer DEFAULT 1757344561088
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`norm` text NOT NULL,
	`created_at` integer DEFAULT 1757344561087
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`bio` text,
	`social_links` text,
	`custom_fields` text,
	`created_at` integer DEFAULT 1757344561087,
	`updated_at` integer DEFAULT 1757344561087,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verificationToken_identifier_token_unique` ON `verificationToken` (`identifier`,`token`);