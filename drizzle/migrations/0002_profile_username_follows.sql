-- Add username column to user table (temporary default for backfill)
ALTER TABLE `user` ADD COLUMN `username` TEXT NOT NULL DEFAULT '';

-- Create follows table
CREATE TABLE IF NOT EXISTS `follows` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `follower_id` TEXT NOT NULL,
  `following_id` TEXT NOT NULL,
  `created_at` INTEGER DEFAULT (strftime('%s','now') * 1000),
  CONSTRAINT `follows_follower_following_unique` UNIQUE (`follower_id`, `following_id`),
  CONSTRAINT `follows_follower_id_fk` FOREIGN KEY (`follower_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_following_id_fk` FOREIGN KEY (`following_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `follows_follower_id_idx` ON `follows` (`follower_id`);
CREATE INDEX IF NOT EXISTS `follows_following_id_idx` ON `follows` (`following_id`);

-- Note: after backfilling usernames, consider dropping the DEFAULT on username
-- (Drizzle migration step or manual change).
