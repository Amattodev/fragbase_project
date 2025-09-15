# Repository Structure Guide (Draft v0.1)

本書は、ファイル/モジュールの配置ルールを示す実務ガイドです。原則は `docs/CODESTYLE.md` と整合します。

## 1. トップレベル

- `app/`: Next.js App Router ルート、レイアウト、`loading.tsx`/`error.tsx`、Server Actions。
- `components/`: 再利用 UI。1コンポーネント=1ファイルを基本。複合ウィジェットはサブフォルダ。
- `lib/`: ドメインロジック、hooks、ユーティリティ。UIに依存しない関心事を集約。
- `db/` `drizzle/`: DBクライアント・スキーマとマイグレーション。アプリ層からのみ参照。
- `types/`: 共有型定義(ドメインごとに小分け)。
- `public/`: 静的ファイル。
- `constants/`: マジック値・定数・フラグ。`as const` + 型付け。
- `scripts/`: ローカル開発用スクリプト(副作用に注意)。

## 2. app/ 配下の構成

- ページ単位でUI/データ取得/エラーハンドリングをコロケーション。
- ルート直下に UI ロジックを置かず、`lib/` or `components/` に切り出す。
- Server Actions は同ルート直下 `actions.ts` などに集約し、`use server` を明示。

例:

```
app/
  articles/
    [id]/
      page.tsx            # サーバーコンポーネント
      loading.tsx
      error.tsx
      actions.ts          # サーバーアクション
```

## 3. components/

- 名前: `PascalCase.tsx`。関連スタイル/小ユーティリティは同フォルダへ。
- 汎用UIは `components/ui/`、ドメイン固有は `components/<domain>/`。
- Tailwind は `cn` を介し、派生Variantは `cva` を使用。

## 4. lib/

- `lib/<domain>/` にユースケースを配置。I/O は Server 側に限定。
- `lib/utils.ts`: `cn` など横断ユーティリティ。
- `lib/errors.ts`: エラー型/生成ヘルパ。
- `lib/validators/`: `zod` スキーマ。

## 5. db/

- `db/schema.ts`: Drizzle スキーマの単一ソース。
- クエリは server-only レイヤ(`lib/<domain>/repo.ts`)にまとめる。

## 6. 命名とインポート

- ルートエイリアス `@/*` を使用。
- インポート順: Node組込 → 外部 → `@/` → 相対。

## 7. テスト配置

- 対象に隣接 `*.test.ts(x)`。
- hooks/ユースケース/Server Actions を優先的にカバー。

## 8. 移行指針(既存コード)

- まずは UI/ロジック/データアクセスの分離を優先。
- フォルダ切り出し時はエクスポート経路(相対→`@/`)へ段階的に置換。

---

このドラフトはPRで改訂し、v1.0として確定します。
