import 'client-only';

import type { ListResponse, Post } from './types';

export async function getPublishedPosts(limit = 12): Promise<Post[]> {
  const res = await fetch(`/api/posts?status=published&limit=${limit}`);
  const data: ListResponse = await res.json();
  if (!data.ok || !data.posts) throw new Error(data.error || 'Failed to fetch posts');
  return data.posts;
}

