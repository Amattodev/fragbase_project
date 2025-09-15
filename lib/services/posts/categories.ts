import 'client-only';

export async function getGameCategories(): Promise<{ id: number; name: string; displayName: string }[]> {
  const res = await fetch('/api/game-categories');
  const data = (await res.json()) as {
    ok: boolean;
    gameCategories: { id: number; name: string }[];
  };
  if (!data.ok) throw new Error('Failed to load game categories');
  return data.gameCategories.map((gc) => ({ ...gc, displayName: gc.name }));
}

