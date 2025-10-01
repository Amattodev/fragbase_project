-- user_game_profiles: stores per-user game profile settings
CREATE TABLE IF NOT EXISTS `user_game_profiles` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` TEXT NOT NULL,
  `game_slug` TEXT NOT NULL,
  `rank` TEXT,
  `main_role` TEXT,
  `main_character` TEXT,
  `platform` TEXT,
  `region` TEXT,
  `ingame_id` TEXT,
  `notes` TEXT,
  `created_at` INTEGER DEFAULT (strftime('%s','now') * 1000),
  `updated_at` INTEGER DEFAULT (strftime('%s','now') * 1000),
  CONSTRAINT `user_game_profiles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_game_profiles_user_game_unique` UNIQUE (`user_id`, `game_slug`)
);

CREATE INDEX IF NOT EXISTS `user_game_profiles_user_idx` ON `user_game_profiles` (`user_id`);
CREATE INDEX IF NOT EXISTS `user_game_profiles_game_idx` ON `user_game_profiles` (`game_slug`);

