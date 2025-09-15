import 'client-only';

export async function getPostLikesCount(id: number | string): Promise<number> {
  const res = await fetch(`/api/posts/${id}/likes/count`);
  const data = (await res.json()) as { ok: boolean; likesCount?: number };
  if (!data.ok) throw new Error('Failed to get likes count');
  return data.likesCount ?? 0;
}

export async function togglePostLike(id: number, userIdentifier: string): Promise<boolean> {
  const res = await fetch(`/api/posts/${id}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIdentifier }),
  });
  const data = (await res.json()) as { ok: boolean };
  if (!data.ok) throw new Error('Failed to toggle like');
  // API does not return liked state; optimistically invert on caller
  return true;
}

