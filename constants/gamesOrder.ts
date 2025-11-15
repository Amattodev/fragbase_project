// Explore用: レールの任意並び順とページサイズ
// 空配列の場合は呼び出し側でデフォルト順（例: name昇順）を使用する想定。

export const EXPLORE_RAIL_ORDER: readonly string[] = [
  // 例: 'valorant', 'apex-legends', 'overwatch-2'
];

export const EXPLORE_RAIL_PAGE_SIZE = 20 as const; // 「もっと見る」で +20

export type ExploreRailOrder = (typeof EXPLORE_RAIL_ORDER)[number];

