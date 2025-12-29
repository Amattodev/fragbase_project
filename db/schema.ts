import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// NextAuth.js用テーブル
export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  // URL用のハンドル（小文字で保存）: 新規作成時はNULL許可、後で付与
  username: text("username").unique(),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: uniqueIndex("account_provider_providerAccountId_unique").on(
      account.provider,
      account.providerAccountId,
    ),
  }),
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: uniqueIndex("verificationToken_identifier_token_unique").on(
      vt.identifier,
      vt.token,
    ),
  }),
);

// Rankings tables
export const rankingSnapshots = sqliteTable("ranking_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(), // 'article' | 'user'
  metric: text("metric").notNull(), // 'likes' | 'posts' | 'comments'
  period: text("period").notNull(), // 'weekly' | 'alltime'
  windowStart: integer("window_start"),
  windowEnd: integer("window_end").notNull(),
  computedAt: integer("computed_at").default(Date.now()).notNull(),
});

export const rankingEntries = sqliteTable("ranking_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id")
    .notNull()
    .references(() => rankingSnapshots.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  postId: integer("post_id"),
  userId: text("user_id"),
  likesCount: integer("likes_count").default(0),
  postsCount: integer("posts_count").default(0),
  commentsCount: integer("comments_count").default(0),
});

// Indexes for rankings
export const rankingSnapshotsUniqueIndex = uniqueIndex("idx_ranking_snapshots_unique").on(
  rankingSnapshots.kind,
  rankingSnapshots.metric,
  rankingSnapshots.period,
  rankingSnapshots.windowEnd,
);

export const rankingEntriesSnapshotRankIndex = index(
  "idx_ranking_entries_snapshot_rank",
).on(rankingEntries.snapshotId, rankingEntries.rank);

// ユーザープロフィール拡張テーブル
export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  bio: text("bio"),
  socialLinks: text("social_links"), // JSON形式
  customFields: text("custom_fields"), // JSON形式（将来の拡張用）
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentHtml: text("content_html").notNull(),
  norm: text("norm").notNull(),
  status: text("status").notNull().default("draft"),
  userId: text("user_id").references(() => users.id), // 認証連携
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  norm: text("norm").notNull(),
  createdAt: integer("created_at").default(Date.now()),
});

export const postTags = sqliteTable("post_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").default(Date.now()),
});

export const postTagsUniqueIndex = uniqueIndex("post_tags_unique_index").on(
  postTags.postId,
  postTags.tagId,
);

export const gameCategories = sqliteTable("game_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  // 2025-11: constants/games.ts の slug と揃えるための列（ユニーク）
  slug: text("slug"),
  createdAt: integer("created_at").default(Date.now()),
});

export const postGameCategories = sqliteTable("post_game_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  gameCategoryId: integer("game_category_id")
    .notNull()
    .references(() => gameCategories.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").default(Date.now()),
});

export const postGameCategoriesUniqueIndex = uniqueIndex("post_game_categories_unique_index").on(
  postGameCategories.postId,
  postGameCategories.gameCategoryId,
);

export const postLikes = sqliteTable("post_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userIdentifier: text("user_identifier").notNull(),
  createdAt: integer("created_at").default(Date.now()),
});

export const postLikesUniqueIndex = uniqueIndex("post_likes_unique_index").on(
  postLikes.postId,
  postLikes.userIdentifier,
);

export const postComments = sqliteTable("post_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  author: text("author"), // コメント投稿者名（後方互換用）
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }), // ログインユーザーのID
  userIdentifier: text("user_identifier"), // 投稿者の識別子（後方互換用）
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

export const postCommentLikes = sqliteTable("post_comment_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  commentId: integer("comment_id")
    .notNull()
    .references(() => postComments.id, { onDelete: "cascade" }),
  userIdentifier: text("user_identifier").notNull(),
  createdAt: integer("created_at").default(Date.now()),
});

export const postCommentsParentIndex = index("post_comments_parent_index").on(
  postComments.parentId,
);

export const postCommentLikesUniqueIndex = uniqueIndex("post_comment_likes_unique_index").on(
  postCommentLikes.commentId,
  postCommentLikes.userIdentifier,
);

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // 基本情報
  game: text("game").notNull(),
  role: text("role").notNull(),
  dpi: integer("dpi").notNull(),
  comment: text("comment"),

  // 追加の共通フィールド
  fpsExperience: text("fpsExperience").notNull().default("不明"),
  character: text("character"),
  device: text("device"),

  // ゲーム固有の設定（JSON形式で保存）
  gameSpecificSettings: text("game_specific_settings"), // JSON文字列として保存

  createdAt: integer("created_at").default(Date.now()),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  settingId: integer("setting_id")
    .notNull()
    .references(() => settings.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  author: text("author"), // コメント投稿者名（オプション）
  createdAt: integer("created_at").default(Date.now()),
});

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  settingId: integer("setting_id")
    .notNull()
    .references(() => settings.id, { onDelete: "cascade" }),
  userIdentifier: text("user_identifier").notNull(),
  createdAt: integer("created_at").default(Date.now()),
});

// フォロー関係
export const follows = sqliteTable(
  "follows",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").default(Date.now()),
  },
  (t) => ({
    followsUnique: uniqueIndex("follows_follower_following_unique").on(
      t.followerId,
      t.followingId,
    ),
    followerIdx: index("follows_follower_id_idx").on(t.followerId),
    followingIdx: index("follows_following_id_idx").on(t.followingId),
  }),
);

export const likesUniqueIndex = uniqueIndex("likes_unique_index").on(
  likes.settingId,
  likes.userIdentifier,
);

// User Game Profiles
export const userGameProfiles = sqliteTable(
  "user_game_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameSlug: text("game_slug").notNull(),
    // Optional fields (all nullable)
    // Legacy/initial fields
    rank: text("rank"),
    mainRole: text("main_role"),
    mainCharacter: text("main_character"),
    platform: text("platform"),
    region: text("region"),
    ingameId: text("ingame_id"),
    notes: text("notes"),
    // New fields (2025-09):
    currentRank: text("current_rank"),
    highestRank: text("highest_rank"),
    accountId: text("account_id"),
    accountUsername: text("account_username"),
    // JSON string array of up to 3 character names in usage order
    mainCharacters: text("main_characters"),
    createdAt: integer("created_at").default(Date.now()),
    updatedAt: integer("updated_at").default(Date.now()),
  },
  (t) => ({
    uniq: uniqueIndex("user_game_profiles_user_game_unique").on(t.userId, t.gameSlug),
    userIdx: index("user_game_profiles_user_idx").on(t.userId),
    gameIdx: index("user_game_profiles_game_idx").on(t.gameSlug),
  }),
);
