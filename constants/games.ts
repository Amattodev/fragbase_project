export type GameDef = { slug: string; nameEn: string };

export const GAMES: GameDef[] = [
  { slug: 'apex-legends', nameEn: 'Apex Legends' },
  { slug: 'overwatch-2', nameEn: 'Overwatch 2' },
  { slug: 'valorant', nameEn: 'VALORANT' },
].sort((a, b) => a.nameEn.localeCompare(b.nameEn));

export function getGameBySlug(slug: string): GameDef | undefined {
  return GAMES.find((g) => g.slug === slug);
}
