-- Relax `user.username`: allow NULL and migrate '' -> NULL
-- 1) Recreate `user` table without NOT NULL on username
CREATE TABLE `__new_user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text,
  `email` text,
  `emailVerified` integer,
  `image` text,
  `username` text
);

-- Preserve unique constraint for email
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `__new_user` (`email`);

-- 2) Copy data, converting empty string usernames to NULL
INSERT INTO `__new_user` ("id", "name", "email", "emailVerified", "image", "username")
SELECT "id", "name", "email", "emailVerified", "image", NULLIF("username", '') AS "username"
FROM `user`;

-- 3) Swap tables
DROP TABLE `user`;
ALTER TABLE `__new_user` RENAME TO `user`;

-- 4) Unique index for username (SQLite allows multiple NULLs on UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS `user_username_unique` ON `user` ("username");

