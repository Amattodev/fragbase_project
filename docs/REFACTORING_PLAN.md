# Refactoring Plan

全体リファクタリングの実行手順です。段階的に進め、いつでも中断・ロールバック可能にします。

## フェーズ0: セーフティ
- Git ブランチ作成: `git checkout -b chore/refactor-structure`
- ビルド/型チェックが通る状態を確認: `npm run lint` / `npm run build`
- DB が必要な場合は初期化: `npm run dev:db`

## フェーズ1: パスエイリアス導入（@/）
`tsconfig.json` に以下を追加/確認（既存設定を壊さないようマージ）。

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

相対パスが深い import は順次 `@/` に置換。最終的に lint で検知・修正します。

## フェーズ2: ディレクトリ雛形の作成
`scripts/refactor-structure.sh` を実行して空ディレクトリとガードファイル（`.gitkeep`）を作成します。

## フェーズ3: 共有UIとルート固有UIの分離
- 再利用されるコンポーネント → `components/*`
- ルート固有（ドメイン固有）のコンポーネント → `app/(group)/_components/*`
- クライアント専用はファイル先頭に `'use client'` を付与。

## フェーズ4: サービス層への抽出
- UI 直下からの `fetch(...)` や DB アクセスを `lib/services/*` に集約。
- サーバーアクションは薄く保ち、処理本体はサービスへ委譲。

## フェーズ5: サーバー/クライアント境界の明示
- サーバー専用: `lib/server/*` に移動し、先頭に `import 'server-only'`。
- クライアント専用: `lib/client/*` に移動し、先頭に `import 'client-only'`。
- `no-restricted-imports` で誤用を lint で防止（ESLint 設定参照）。

## フェーズ6: 定数・型の単一化
- ルーティング/設定値 → `constants/*`
- 共有型 → `types/*`（Zod があれば `*.zod.ts` と合わせて運用）

## フェーズ7: 静的検証と動作確認
- `npm run lint` → import 並び順・禁止依存の検出を修正
- `npm run build` → バンドルエラーの解消
- Cloudflare 変更時 → `npm run cf-typegen`

## フェーズ8: ドキュメント更新
- 本ファイルと `docs/ARCHITECTURE.md` を最終状態に合わせて更新
- 変更点と移行手順を PR に記載（スクリーンショット/確認方法を添付）

## 受け入れ基準（Definition of Done）
- `app/*` にビジネスロジックが残っていない
- 共有 UI は `components/*` に集約、ルート固有は `_components/` に限定
- サービス層経由でのみ DB/外部 API に触れている
- `lib/server/*` のクライアント import が 0 件
- `npm run lint` と `npm run build` が成功

