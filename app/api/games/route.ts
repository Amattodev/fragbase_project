import { GAMES } from '@/constants/games';

export async function GET() {
  const games = GAMES.map((g) => ({ slug: g.slug, name: g.nameEn }));
  return new Response(JSON.stringify({ ok: true, games }), {
    headers: { 'content-type': 'application/json' },
  });
}

