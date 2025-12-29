-- Add user_id column to post_comments table for logged-in user comments
ALTER TABLE `post_comments` ADD COLUMN `user_id` TEXT REFERENCES `user`(`id`) ON DELETE SET NULL;
