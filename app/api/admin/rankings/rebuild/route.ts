import { rebuildAllSnapshots } from '@/lib/services/server/rankings';

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request: Request) {
  const secret = process.env.RANKINGS_CRON_SECRET;
  if (secret && secret.length > 0) {
    const token = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
    if (token !== secret) return unauthorized();
  }

  try {
    const result = await rebuildAllSnapshots();
    return new Response(JSON.stringify({ ok: true, window: result.weeklyWindow }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to rebuild rankings';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}

export async function GET(request: Request) {
  // Allow GET for manual debugging with the same secret check
  return POST(request);
}

