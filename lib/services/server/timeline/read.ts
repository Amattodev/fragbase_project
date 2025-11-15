import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { posts } from '@/db/schema';
import { TIMELINE_DEFAULT_PAGE_SIZE } from '@/lib/constants/timeline';
import { getDatabase } from '@/lib/server/db';
import { convertDatabaseRowsToPostCards, type PostDatabaseRow } from '@/lib/services/server/posts/transform';
import type { Post } from '@/lib/services/posts/types';

export type TimelineList = { posts: Post[]; pagination: { limit: number; offset: number; hasMore: boolean } };

export async function listTimelinePosts({
  limit = TIMELINE_DEFAULT_PAGE_SIZE,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}): Promise<TimelineList> {
  const database = getDatabase();
  const rows = (await database
    .select()
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1)
    .offset(offset)) as PostDatabaseRow[];

  const hasMore = rows.length > limit;
  const sliced = rows.slice(0, limit);
  const postCards = await convertDatabaseRowsToPostCards(sliced);
  return { posts: postCards, pagination: { limit, offset, hasMore } };
}

