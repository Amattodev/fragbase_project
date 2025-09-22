export type GameDef = { slug: string; nameEn: string };

export const GAMES: GameDef[] = [
  { slug: 'apex-legends', nameEn: 'Apex Legends' },
  { slug: 'cs2', nameEn: 'Counter-Strike 2' },
  { slug: 'dota-2', nameEn: 'Dota 2' },
  { slug: 'fortnite', nameEn: 'Fortnite' },
  { slug: 'league-of-legends', nameEn: 'League of Legends' },
  { slug: 'overwatch-2', nameEn: 'Overwatch 2' },
  { slug: 'rainbow-six-siege', nameEn: 'Rainbow Six Siege' },
  { slug: 'valorant', nameEn: 'VALORANT' },
].sort((a, b) => a.nameEn.localeCompare(b.nameEn));

export function getGameBySlug(slug: string): GameDef | undefined {
  return GAMES.find((g) => g.slug === slug);
}

