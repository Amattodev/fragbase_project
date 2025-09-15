## 開発メモ

- コード規約は `docs/CODESTYLE.md` を参照してください (v1.0)。
- 変更提案は `docs/adr` に ADR を追加してPRで議論します。
- 整形は Prettier、Lint は Next.js ESLint(Flat Config)。

### セットアップ(整形/フック)

1. 依存を追加: `npm i -D prettier prettier-plugin-tailwindcss prettier-plugin-organize-imports husky lint-staged`
2. Husky を有効化: `npm run prepare`
3. フォーマット実行: `npm run format`
4. Lint 実行: `npm run lint` / 自動修正 `npm run lint:fix`
