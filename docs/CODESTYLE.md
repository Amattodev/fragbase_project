# CODESTYLE v1.0

本ドキュメントは本リポジトリのコード規約の決定版(v1.0)です。変更は `docs/adr` に提案(PR)し、承認後に次版を発行します。

## 対象範囲

- 言語/ランタイム: TypeScript, Node.js, Next.js(App Router)
- UI: React, Tailwind CSS
- データ: Drizzle ORM + SQLite(開発)
- テスト: Vitest + React Testing Library(導入予定)
- CI/運用: OpenNext + Cloudflare(本番)

## TypeScript

- `strict: true` を前提。
- `any` は禁止。やむを得ず使う場合は `// @ts-expect-error` を必須化し理由を添える。
- 型エイリアスを基本(`type`)。外部公開の構造的APIには `interface` を許容。
- `enum` より `as const` + ユニオン型を優先。
- 型の再利用は `types/` またはドメイン直下にコロケーション。

## React/Next(App Router)

- 既定はサーバーコンポーネント。`use client` は UI/ブラウザAPI/インタラクションに限定。
- データ取得は Server Actions / Route Handlers へ集約。クライアントでの直接フェッチは避ける。
- エラーは Error Boundary とユースケース別の型付きエラー(`lib/errors.ts`)で一貫化。
- 非同期UIは `Suspense` を積極的に利用。ローディング/エラー UI は `app/*` にコロケーション。

## ディレクトリ構造(要旨)

- `app/`: ルート/レイアウト/サーバーアクションをコロケーション。
- `components/`: 再利用UI(小さく、責務を限定)。
- `lib/`: 共通ロジック・hooks・ユーティリティ。フォーム/バリデーション等もここに。
- `db/`, `drizzle/`: DBクライアントとマイグレーション。
- `types/`: 共有型定義。
- `public/`: 静的アセット。

## 命名・ファイル

- コンポーネントは `PascalCase.tsx`、hooks は `useX.ts`。
- 変数/関数は `camelCase`、定数は `SCREAMING_SNAKE_CASE` もしくは `const NAME = ... as const`。
- ファイル名は英小文字-kebab を推奨(Reactコンポーネントは例外でPascalCase)。
- バレル(`index.ts`)は最小限に。

## インポート方針

- ルート別名: `@/*` を使用。
- 標準→外部→`@/`→相対 の順でグルーピング。
- 型は `import type` を用いて明示。副作用のないユーティリティはデフォルトエクスポートを避け、名前付きに統一。

## スタイリング

- Tailwindを第一選択。複雑な条件分岐は `lib/utils.ts` の `cn` を用いる。
- バリアントは `class-variance-authority` を使用。
- クラス順序は Prettier の `prettier-plugin-tailwindcss` で自動整列。

## 状態管理とフォーム

- グローバル状態は最小に。まずはコンポーネント/ルート単位の `useState`/`useReducer`。
- フォームは `react-hook-form` + `zod` を標準化し、スキーマを単一ソースに。

## DB/Drizzle

- スキーマは `db/schema.ts`。クエリ/ユースケースはサーバー専用層に集約し、クライアントへ流さない。
- 型は Drizzle の自動推論を活用。マイグレーションは `drizzle/migrations` 一元管理。

## エラー/ログ/セキュリティ

- PII はログしない。例外経路には監査可能なIDのみ。
- APIエラー形式は `{ ok: false, code, message }` を基本形とし、クライアントで分岐可能に。
- 秘密情報は `.env`/Cloudflare 変数に限定し、クライアントへ渡さない。

## テスト

- 重要経路(認証/DB/主要ルート)を優先。`*.test.ts(x)` を対象コード近傍にコロケーション。
- スナップショットは最低限。副作用はモック/テストダブルで隔離。

## PR/コミット

- 簡潔・現在形のメッセージ(日本語/英語可)。例: "Fix API error" / "APIエラーを解消"。
- PRには: 変更概要、UI差分(必要ならSS)、検証手順、DB変更(あれば)を記載。
- `npm run lint` / `npm run build` を通すこと。スキーマ変更時は `npm run dev:db` を添える。

## 自動化(整形/静的解析)

- フォーマット: Prettier を採用。Tailwind並びはプラグインで自動化。
- Lint: Next.js ESLint(Flat Config)をベースに、警告ゼロ方針。
- コミット時: `lint-staged` で Prettier と ESLint の自動修正を実行。

---

### 付録: 例

```tsx
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground",
        "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
```
