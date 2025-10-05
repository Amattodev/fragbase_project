-- Relax user.username to allow NULLs (fix NextAuth createUser insert issues)
-- Approach: table swap (SQLite-compatible)

PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS `__new_user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text,
  `email` text,
  `emailVerified` integer,
  `image` text,
  `username` text -- nullable
);

-- copy existing data; convert empty string to NULL for username
INSERT INTO `__new_user` (id, name, email, emailVerified, image, username)
SELECT id, name, email, emailVerified, image,
  CASE WHEN username IS NULL OR username = '' THEN NULL ELSE username END AS username
FROM `user`;

DROP TABLE `user`;
ALTER TABLE `__new_user` RENAME TO `user`;

-- restore indexes
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);

PRAGMA foreign_keys=ON;

