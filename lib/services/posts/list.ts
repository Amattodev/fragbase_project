import 'client-only';

import type { ListResponse, Post } from './types';

export async function getPublishedPosts({ limit = 12, offset = 0, gameSlug }: { limit?: number; offset?: number; gameSlug?: string } = {}): Promise<Post[]> {
  const q = new URLSearchParams({ status: 'published', limit: String(limit), offset: String(offset) });
  if (gameSlug) q.set('game', gameSlug);
  const res = await fetch(`/api/posts?${q.toString()}`);
  const data: ListResponse = await res.json();
  if (!data.ok || !data.posts) throw new Error(data.error || 'Failed to fetch posts');
  return data.posts;
}

export async function listPosts(params: { status?: 'published' | 'draft' | 'all'; limit?: number; offset?: number; gameSlug?: string } = {}): Promise<ListResponse> {
  const { status = 'published', limit = 12, offset = 0, gameSlug } = params;
  const q = new URLSearchParams({ status, limit: String(limit), offset: String(offset) });
  if (gameSlug) q.set('game', gameSlug);
  const res = await fetch(`/api/posts?${q.toString()}`);
  const data: ListResponse = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to fetch posts');
  return data;
}
