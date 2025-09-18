import 'client-only';

// Development-only helper to fetch raw NextAuth session JSON
export async function debugFetchSession(): Promise<unknown | null> {
  if (process.env.NODE_ENV === 'production') return null;
  try {
    const res = await fetch('/api/auth/session');
    return await res.json();
  } catch (e) {
    // Swallow to avoid noisy errors in dev logs
    return null;
  }
}

