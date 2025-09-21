# プロフィール機能 仕様（MVP）

最終更新: 2025-09-18

## 概要
- ログインユーザーが公開プロフィールページを持ち、編集できる。
- 公開ページにはプロフィール情報とタブ（作成した記事/いいねした記事/ゲームタイトル）を表示。
- 集計は公開記事のみ対象。ブックマークはMVPでは非対応。
- フォロー機能はMVPに含める。

## 公開プロフィール `/profile/[username]`
- ヘッダー
  - アバター、表示名、`@username`
  - 自己紹介（2–3行まで、残りは「もっと見る」）
  - 数字: フォロワー数 / 記事の総いいね数 / 公開記事数
  - SNSアイコン: X / YouTube / Twitch / Steam / Discord（既知）+ 任意追加（汎用アイコン）
  - フォロー/フォロー解除ボタン（本人は「プロフィールを編集」）
- タブ（sticky）
  - 作成した記事: 自分の公開記事一覧（新着順）
  - いいねした記事: 自分が「いいね」した公開記事一覧（新着順）
  - ゲームタイトル: 後続で仕様詳細を詰める（MVPはプレースホルダー/空状態）
- 本文
  - 記事カードのグリッド（既存 PostCard 流用）
  - ページネーション推奨（無限スクロールは将来検討）

## 数字の定義
- フォロワー数: `follows` テーブルで `followingId = 対象ユーザーID` の件数
- 記事の総いいね数: 対象ユーザーの公開記事に付いた `post_likes` の合計
- 公開記事数: `posts.status = 'published' AND posts.userId = 対象ユーザーID`

## プロフィール編集 `/settings/profile`（要ログイン）
- 変更可能: `username`（URLハンドル・一意）/ `bio`（自己紹介）/ `social_links`（SNS）
- 保存後: 公開ページを即時反映（revalidate）
- SNS拡張: 既定5種は専用アイコン、未知キーは汎用アイコン。保存形式は JSON（`Record<string, string>`）

## フォロー機能（MVP）
- 仕様: ログイン必須／自分自身は不可／フォロー・解除トグル／状態取得
- テーブル案: `follows(id PK, followerId TEXT, followingId TEXT, createdAt INTEGER)`
  - ユニーク制約: `(followerId, followingId)`
  - インデックス: `followerId`, `followingId`

## データモデル（既存 + 追加）
- 既存: 
  - `users(id, name, email, image, emailVerified)`
  - `user_profiles(user_id UNIQUE, bio, social_links(JSON), custom_fields, created_at, updated_at)`
  - 記事/いいね: `posts`, `post_likes`
- 追加/拡張:
  - `users.username TEXT UNIQUE NOT NULL`（小文字・3–20・英数/`_`/`-`、先頭末尾に`-/_`不可、予約語除外）
  - `follows`（上記）
  - 新規ユーザー作成時に `user_profiles` の空行を自動生成

## API / サーバーアクション（IF 概要）
- 取得
  - `GET /api/users/:username` … 公開プロフィール + 集計 + viewer のフォロー状態
  - `GET /api/users/:username/posts?page=` … 作成記事一覧（公開）
  - `GET /api/users/:username/likes?page=` … いいねした記事一覧（公開）
- フォロー
  - `POST /api/users/:username/follow`（フォロー）
  - `DELETE /api/users/:username/follow`（解除）
- 更新（サーバーアクション推奨）
  - `actions/profile.update(form)` … `users.name/username`, `user_profiles.bio/social_links` を更新
- 変更時に `revalidatePath('/profile/[username]')` / `revalidatePath('/me')`

## バリデーション
- `username`: `^[a-z0-9](?:[a-z0-9_-]{1,18}[a-z0-9])?$`
- `bio`: 最大 280 文字
- SNS URL: `https?://` 必須。既知ドメイン（`x.com|twitter.com`, `youtube.com`, `twitch.tv`, `store.steampowered.com|steamcommunity.com`, `discord.gg|discord.com`）の簡易チェック。

## UX/アクセシビリティ
- ローディングスケルトン/空状態
- モバイル最適化（ヘッダー縦積み、2→1カラム）
- アイコンへ代替ラベル、キーボード操作可能

## SEO/メタ
- `title`: `{name} (@{username})`
- `description`: `bio` の先頭 80 文字 + 数字サマリ
- OGP: アバター/名前入りの簡易カード

## 決定事項（合意済み）
- ブックマークはMVPでは未対応
- SNSは X/YouTube/Twitch/Steam/Discord を既定として表示、追加は自由入力で保存可
- 集計は公開記事のみ
- フォロー機能はMVPに含む

## 未決定/後続検討
- ゲームタイトルタブの挙動詳細（カテゴリ軸か設定軸か）
- 「いいねした記事」タブの公開可否を将来切り替え可能にするか（現状: 公開）

---
本仕様は実装前の設計ガイドです。変更があれば本ファイルを更新してください。
