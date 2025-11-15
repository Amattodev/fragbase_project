-- Add slug column to game_categories and unique index
ALTER TABLE `game_categories` ADD COLUMN `slug` TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS `game_categories_slug_unique` ON `game_categories` (`slug`);

