import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
    settingId: integer("setting_id").notNull().references(() => settings.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    author: text("author"), // コメント投稿者名（オプション）
    createdAt: integer("created_at").default(Date.now()),
});
