import { syncGamesFromConstants } from '@/lib/services/server/gameCatalog';

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request: Request) {
  const secret = process.env.GAMES_SYNC_SECRET;
  if (secret && secret.length > 0) {
    const token = request.headers.get('x-games-sync-secret') || new URL(request.url).searchParams.get('secret');
    if (token !== secret) return unauthorized();
  }
  try {
    const result = await syncGamesFromConstants();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to sync games';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function GET(request: Request) {
  // Allow GET for testing with the same secret check
  return POST(request);
}

