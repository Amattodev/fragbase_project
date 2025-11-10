// Explore用: slug -> game_categories.name の暫定対応候補（複数）
// 将来的に DB `game_categories.slug` を追加して完全一致でJOINする計画。

export const GAME_CATEGORY_NAME_CANDIDATES_BY_SLUG: Readonly<Record<string, readonly string[]>> = {
  // 代表的な別名や略称も含める（LIKEマッチ用）
  "valorant": ["VALORANT", "Valorant"],
  "apex-legends": ["Apex Legends", "APEX"],
  "overwatch-2": ["Overwatch 2", "OW2", "Overwatch2"],
  "rainbow-six-siege": ["Rainbow Six Siege", "R6S", "Rainbow 6 Siege"],
  "league-of-legends": ["League of Legends", "LoL"],
  "cs2": ["Counter-Strike 2", "CS2", "Counter Strike 2"],
  "dota-2": ["Dota 2", "DOTA2"],
  "fortnite": ["Fortnite"],
};

export function resolveGameCategoryCandidates(slug: string, fallbackName?: string): string[] {
  const c = GAME_CATEGORY_NAME_CANDIDATES_BY_SLUG[slug];
  if (c && c.length > 0) return [...c];
  return fallbackName ? [fallbackName] : [slug];
}

