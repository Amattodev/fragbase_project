# Architecture

本プロジェクトのディレクトリ規約と依存ルールを定義します。App Router を中心に、共有資産の境界を明確化し、段階的リファクタリングを容易にします。

## 目的
- 変更に強いレイアウトとルーティング構成。
- ドメイン（機能）単位の疎結合化と責務分離。
- サーバー/クライアント境界の誤用防止。

## ディレクトリ構成（決定）
- `app/` — Next.js App Router ルート・レイアウト・サーバーアクション
  - ルートグループ: `app/(marketing)/`, `app/(dashboard)/`
  - ルート固有の部品: `app/(group)/_components/`
  - API ルート: `app/api/**/route.ts`
  - サーバーアクション: 各セグメント直下に `actions.ts`
- `components/` — 再利用 UI（アプリ横断）
  - `components/ui/`, `components/forms/`, `components/feedback/`
  - 公開面は `components/index.ts` に集約（バレル）
- `lib/` — 共通ロジック
  - `lib/hooks/`（フック）, `lib/utils/`（純関数）, `lib/services/`（外部APIやDBへ触れる境界）
  - `lib/server/`（サーバー専用）: 先頭に `import 'server-only'`
  - `lib/client/`（クライアント専用）: 先頭に `import 'client-only'`
- `constants/` — 共有定数（`routes.ts`, `config.ts`, 機能別定数など）
- `db/` — Drizzle クライアントとスキーマ（Cloudflare/SQLite を環境で切替）
- `drizzle/migrations/` — 既存の SQL マイグレーション
- `types/` — 共有型（必要に応じ Zod 連携）
- `public/` — 静的アセット
- `scripts/` — ローカルツール

## ドメイン分割（決定）
- Core: `auth`, `workspace`, `project`
- Supporting: `files`, `settings`, `billing`, `analytics`
- ルート配置例
  - `app/(marketing)/page.tsx`（LP/Docs等）
  - `app/(dashboard)/layout.tsx`, `app/(dashboard)/[workspace]/page.tsx`
  - 各ルート固有の UI は `app/(dashboard)/_components/` に同居

## 依存ルール（決定）
1. `app/*` → `components/*`, `lib/*`, `constants/*`, `types/*` を参照可。
2. `components/*` → `lib/*`, `constants/*`, `types/*` を参照可（`app/*` 参照不可）。
3. `lib/services/*` のみが `db/*`・外部APIへ直接アクセス可。UIからの直接アクセスは禁止。
4. `lib/server/*` をクライアント側（`'use client'`）で import 禁止。
5. バレル（`index.ts`）は共有ディレクトリのみで許可。`app/*` には作らない。

## 命名・配置
- コンポーネント: `PascalCase`（例: `Button.tsx`）。
- フック: `useX.ts`。共有は `lib/hooks/`、ルート固有は `_components/` 近接に併置可。
- サービス: `lib/services/*` に集約（API/DB 呼び出し・データ取得）。
- 型: 共有は `types/*`、機能固有は近接配置も可（循環禁止）。
- 定数: ルーティングは `constants/routes.ts` を単一の参照源に。
- インポート: `@/*` エイリアスを使用（`tsconfig.json` で定義）。

## Lint/型の補強（推奨）
- import 並び順: builtin → external → internal(`@/`) → relative。
- `no-restricted-imports` で `app/*` 参照や `lib/server/*` 誤用を禁止。
- Cloudflare 変更時は `npm run cf-typegen` を運用ルーチンへ。

## データフロー
UI（`app/*`, `components/*`） → Service（`lib/services/*`） → DB/外部API（`db/*` or fetch）。
サーバーアクションはフォーム/ミューテーションに限定し、ロジックはサービスに委譲。

## チェックリスト
- [ ] `app/*` にビジネスロジックが残っていない
- [ ] ルート固有部品は `app/(group)/_components/` にある
- [ ] `components/*` が `app/*` を参照していない
- [ ] API/DB 呼び出しが `lib/services/*` に一本化
- [ ] `lib/server/*` のクライアント側 import なし

