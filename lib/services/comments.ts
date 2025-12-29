import 'client-only';

export type CommentUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type Comment = {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  author: string;
  user: CommentUser | null;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  repliesCount: number;
};

export async function getComments(
  postId: number,
  options: { limit?: number; offset?: number; userIdentifier: string },
): Promise<{ comments: Comment[]; hasMore: boolean }> {
  const { limit = 20, offset = 0, userIdentifier } = options;
  const res = await fetch(
    `/api/posts/${postId}/comments?limit=${limit}&offset=${offset}&userIdentifier=${encodeURIComponent(
      userIdentifier,
    )}`,
  );
  const data = (await res.json()) as {
    ok: boolean;
    comments?: Comment[];
    pagination?: { hasMore: boolean };
    error?: string;
  };
  if (!data.ok || !data.comments || !data.pagination)
    throw new Error(data.error || 'Failed to fetch comments');
  return { comments: data.comments, hasMore: data.pagination.hasMore };
}

export async function getCommentsCount(postId: number): Promise<number> {
  const res = await fetch(`/api/posts/${postId}/comments/count`);
  const data = (await res.json()) as { ok: boolean; commentsCount?: number };
  if (!data.ok) throw new Error('Failed to fetch comments count');
  return data.commentsCount ?? 0;
}

export async function createComment(
  postId: number,
  payload: { content: string; parentId?: number | null },
): Promise<Comment> {
  const res = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: payload.content,
      parentId: payload.parentId ?? null,
    }),
  });
  const data = (await res.json()) as { ok: boolean; comment?: Comment; error?: string };
  if (!data.ok || !data.comment) throw new Error(data.error || 'Failed to post comment');
  return data.comment;
}

export async function getReplies(
  postId: number,
  commentId: number,
  userIdentifier: string,
): Promise<Comment[]> {
  const res = await fetch(
    `/api/posts/${postId}/comments/${commentId}/replies?userIdentifier=${encodeURIComponent(
      userIdentifier,
    )}`,
  );
  const data = (await res.json()) as { ok: boolean; replies?: Comment[]; error?: string };
  if (!data.ok || !data.replies) throw new Error(data.error || 'Failed to fetch replies');
  return data.replies;
}

export async function toggleCommentLike(
  postId: number,
  commentId: number,
  userIdentifier: string,
): Promise<boolean> {
  const res = await fetch(`/api/posts/${postId}/comments/${commentId}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIdentifier }),
  });
  const data = (await res.json()) as { ok: boolean; liked?: boolean };
  if (!data.ok || typeof data.liked !== 'boolean') throw new Error('Failed to toggle like');
  return data.liked;
}

