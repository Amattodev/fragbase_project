import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentHtml: text("content_html").notNull(),
  norm: text("norm").notNull(),
  status: text("status").notNull().default("draft"),
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
  postTags.tagId
);

export const gameCategories = sqliteTable("game_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
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

export const postGameCategoriesUniqueIndex = uniqueIndex(
  "post_game_categories_unique_index"
).on(postGameCategories.postId, postGameCategories.gameCategoryId);

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
  postLikes.userIdentifier
);

export const postComments = sqliteTable("post_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  author: text("author"), // コメント投稿者名（オプション）
  userIdentifier: text("user_identifier"), // 投稿者の識別子（オプション）
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
  postComments.parentId
);

export const postCommentLikesUniqueIndex = uniqueIndex(
  "post_comment_likes_unique_index"
).on(postCommentLikes.commentId, postCommentLikes.userIdentifier);

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

export const likesUniqueIndex = uniqueIndex("likes_unique_index").on(
  likes.settingId,
  likes.userIdentifier
);
