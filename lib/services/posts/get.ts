import 'client-only';

import type { Post, SingleResponse } from './types';

export async function getPost(id: number | string): Promise<Post> {
  const res = await fetch(`/api/posts/${id}`);
  const data: SingleResponse = await res.json();
  if (!data.ok || !data.post) throw new Error(data.error || 'Post not found');
  return data.post;
}

