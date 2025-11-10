import 'client-only';

export type GameCatalogItem = { slug: string; name: string };

export async function getGamesCatalog(): Promise<GameCatalogItem[]> {
  const res = await fetch('/api/games');
  const data = (await res.json()) as { ok: boolean; games?: GameCatalogItem[]; error?: string };
  if (!data.ok || !data.games) throw new Error(data.error || 'Failed to load games catalog');
  return data.games;
}

