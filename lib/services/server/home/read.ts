import { and, desc, eq, gte, inArray } from "drizzle-orm";

import { postComments, postLikes, posts } from "@/db/schema";
import { HOME_DEFAULT_SECTION_LIMIT } from "@/lib/constants/home";
import { getDatabase } from "@/lib/server/db";
import type { Post } from "@/lib/services/posts/types";
import {
  convertDatabaseRowsToPostCards,
  type PostDatabaseRow,
} from "@/lib/services/server/posts/transform";

// (no InferSelectModel here; types moved to shared transform module)

export async function fetchHomeRecentPosts({
  limit = HOME_DEFAULT_SECTION_LIMIT,
}: { limit?: number } = {}) {
  const database = getDatabase();
  const recentPostRows = await database
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
  return convertDatabaseRowsToPostCards(recentPostRows as PostDatabaseRow[]);
}

export async function fetchHomeTrendingPosts({
  limit = HOME_DEFAULT_SECTION_LIMIT,
  currentTimeMs = Date.now(),
}: {
  limit?: number;
  currentTimeMs?: number;
} = {}) {
  const database = getDatabase();
  const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  const publishedWindowStart = currentTimeMs - sevenDaysInMilliseconds;

  // 候補記事: 直近7日以内に公開
  const candidatePosts = await database
    .select()
    .from(posts)
    .where(and(eq(posts.status, "published"), gte(posts.createdAt, publishedWindowStart)))
    .orderBy(desc(posts.createdAt))
    .limit(500);

  if (candidatePosts.length === 0) return [] as Post[];

  const candidatePostIds = candidatePosts.map((post) => post.id);

  // 累計いいね数（表示にも使用）
  const postLikeRows = await database
    .select()
    .from(postLikes)
    .where(inArray(postLikes.postId, candidatePostIds));
  const likesCountByPostId = new Map<number, number>();
  for (const likeRow of postLikeRows)
    likesCountByPostId.set(likeRow.postId!, (likesCountByPostId.get(likeRow.postId!) || 0) + 1);

  // 累計コメント数（スコア計算のみで使用）
  const postCommentRows = await database
    .select()
    .from(postComments)
    .where(inArray(postComments.postId, candidatePostIds));
  const commentsCountByPostId = new Map<number, number>();
  for (const commentRow of postCommentRows)
    commentsCountByPostId.set(
      commentRow.postId!,
      (commentsCountByPostId.get(commentRow.postId!) || 0) + 1,
    );

  // 並び替え: score DESC → likes DESC → createdAt DESC → id DESC
  const sortedByTrendingScore = [...(candidatePosts as PostDatabaseRow[])].sort((postA, postB) => {
    const likesOfA = likesCountByPostId.get(postA.id) || 0;
    const likesOfB = likesCountByPostId.get(postB.id) || 0;
    const commentsOfA = commentsCountByPostId.get(postA.id) || 0;
    const commentsOfB = commentsCountByPostId.get(postB.id) || 0;
    const scoreA = likesOfA + 2 * commentsOfA;
    const scoreB = likesOfB + 2 * commentsOfB;
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (likesOfB !== likesOfA) return likesOfB - likesOfA;
    if (postB.createdAt !== postA.createdAt)
      return (postB.createdAt as number) - (postA.createdAt as number);
    return (postB.id as number) - (postA.id as number);
  });

  const topPosts = sortedByTrendingScore.slice(0, limit);
  return convertDatabaseRowsToPostCards(topPosts as PostDatabaseRow[]);
}
