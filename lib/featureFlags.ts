// 記事投稿機能を全環境で有効化
export function isPostingEnabled(): boolean {
  return true;
}

export const POSTING_FEATURE = {
  enabled: true,
  description: "記事投稿機能の有効化",
  environments: ["all"],
} as const;
