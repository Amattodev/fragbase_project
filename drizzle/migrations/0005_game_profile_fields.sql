-- Enhance user_game_profiles with specific fields requested
-- - current_rank, highest_rank
-- - account_id, account_username
-- - main_characters (JSON string array, ordered by frequency)

ALTER TABLE `user_game_profiles` ADD COLUMN `current_rank` TEXT;
ALTER TABLE `user_game_profiles` ADD COLUMN `highest_rank` TEXT;
ALTER TABLE `user_game_profiles` ADD COLUMN `account_id` TEXT;
ALTER TABLE `user_game_profiles` ADD COLUMN `account_username` TEXT;
ALTER TABLE `user_game_profiles` ADD COLUMN `main_characters` TEXT;

