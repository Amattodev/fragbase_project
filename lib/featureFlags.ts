// 開発環境用と本番環境で記事投稿機能を制御するフラグ
const FEATURE_POSTING =
  process.env.NODE_ENV === "development" ||
  process.env.FEATURE_POSTING === "true";

export function isPostingEnabled(): boolean {
  return FEATURE_POSTING;
}

export const POSTING_FEATURE = {
  enabled: FEATURE_POSTING,
  description: "記事投稿機能の有効化",
  environments: ["development"],
  productionOverride: "FEATURE_POSTING=true",
} as const;
