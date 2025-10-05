-- Rankings feature: snapshots and entries + helpful indexes
-- Period/Timezone: handled in app logic (JST). This migration adds storage only.

-- ranking_snapshots: stores one row per computed ranking snapshot
CREATE TABLE IF NOT EXISTS `ranking_snapshots` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `kind` TEXT NOT NULL CHECK (`kind` IN ('article','user')),
  `metric` TEXT NOT NULL, -- 'likes' | 'posts' | 'comments'
  `period` TEXT NOT NULL CHECK (`period` IN ('weekly','alltime')),
  `window_start` INTEGER,
  `window_end` INTEGER NOT NULL,
  `computed_at` INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_ranking_snapshots_unique`
  ON `ranking_snapshots` (`kind`, `metric`, `period`, `window_end`);

-- ranking_entries: items within a snapshot (either post-based or user-based)
CREATE TABLE IF NOT EXISTS `ranking_entries` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `snapshot_id` INTEGER NOT NULL REFERENCES `ranking_snapshots`(`id`) ON DELETE CASCADE,
  `rank` INTEGER NOT NULL,
  `post_id` INTEGER,
  `user_id` TEXT,
  `likes_count` INTEGER DEFAULT 0,
  `posts_count` INTEGER DEFAULT 0,
  `comments_count` INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS `idx_ranking_entries_snapshot_rank`
  ON `ranking_entries` (`snapshot_id`, `rank`);

-- Helpful indexes to support aggregation queries
CREATE INDEX IF NOT EXISTS `idx_posts_status_created` ON `posts`(`status`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_posts_user_status` ON `posts`(`user_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_post_likes_created_post` ON `post_likes`(`created_at`, `post_id`);
CREATE INDEX IF NOT EXISTS `idx_post_likes_post` ON `post_likes`(`post_id`);
CREATE INDEX IF NOT EXISTS `idx_post_comments_created_post` ON `post_comments`(`created_at`, `post_id`);
CREATE INDEX IF NOT EXISTS `idx_post_comments_post` ON `post_comments`(`post_id`);

