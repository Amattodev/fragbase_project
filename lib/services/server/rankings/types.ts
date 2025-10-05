// ランキング関連の共通型と定数

export type RankingKind = 'article' | 'user';
export type RankingMetric = 'likes' | 'posts' | 'comments';
export type RankingPeriod = 'weekly' | 'alltime';

// 集計ウィンドウ（ms, UTC）
export type TimeWindow = { start: number | null; end: number };

/**
 * スナップショットに保存する最大件数。
 * - UI は 1ページ20件を想定しつつ、上位200件保持で将来のページングに備える。
 */
export const TOP_N_DEFAULT = 200 as const;

