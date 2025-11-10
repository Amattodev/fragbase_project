import 'client-only';

import type { Post } from './types';

export async function updatePost(
  id: number,
  payload: Partial<Pick<Post, 'title' | 'content' | 'status'>> & {
    tags?: string[];
    gameCategories?: string[]; // backward compat (names)
    gameSlugs?: string[]; // preferred
  },
): Promise<Post> {
  const res = await fetch(`/api/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok: boolean; post?: Post; error?: string };
  if (!data.ok || !data.post) throw new Error(data.error || 'Failed to update post');
  return data.post;
}

export async function deletePost(id: number): Promise<void> {
  const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
  const data = (await res.json()) as { ok: boolean; error?: string };
  if (!data.ok) throw new Error(data.error || 'Failed to delete post');
}

export async function createPost(): Promise<Post> {
  const res = await fetch('/api/posts', { method: 'POST' });
  const data = (await res.json()) as { ok: boolean; post?: Partial<Post>; error?: string };
  if (!data.ok || !data.post) throw new Error(data.error || 'Failed to create post');
  // Normalize optional arrays so UI can rely on them
  const normalized: Post = {
    id: Number(data.post.id),
    title: data.post.title ?? '',
    content: data.post.content ?? '',
    excerpt: (data as any).post?.excerpt ?? '',
    status: data.post.status ?? 'draft',
    slug: data.post.slug ?? '',
    createdAt: Number((data as any).post?.createdAt ?? Date.now()),
    updatedAt: Number((data as any).post?.updatedAt ?? Date.now()),
    tags: (data as any).post?.tags ?? [],
    gameCategories: (data as any).post?.gameCategories ?? [],
    user: (data as any).post?.user,
  };
  return normalized;
}
