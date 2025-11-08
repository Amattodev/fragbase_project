import { and, desc, eq, gte, inArray } from "drizzle-orm";

import {
  gameCategories,
  postComments,
  postGameCategories,
  postLikes,
  postTags,
  posts,
  tags,
  users,
} from "@/db/schema";
import { HOME_DEFAULT_SECTION_LIMIT } from "@/lib/constants/home";
import { getDatabase } from "@/lib/server/db";
import type { Post } from "@/lib/services/posts/types";

import type { InferSelectModel } from "drizzle-orm";

function extractExcerptFromHtml(html: string | null | undefined, maxLength = 120): string {
  const plainText = (html || "").replace(/<[^>]*>/g, "");
  return plainText.slice(0, maxLength);
}

// ---- Helper types & builders to keep complexity low ----
type PostRow = InferSelectModel<typeof posts>;
type PostDatabaseRow = Pick<
  PostRow,
  | "id"
  | "title"
  | "content"
  | "contentHtml"
  | "slug"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "userId"
>;

type TagDetails = { id: number; name: string; norm: string };
type GameCategoryDetails = { id: number; name: string; displayName: string };
type UserDetails = { id: string; name: string | null; image: string | null };

async function buildTagsByPostIdMap(postIds: number[]) {
  const database = getDatabase();
  if (postIds.length === 0) return new Map<number, TagDetails[]>();
  const postTagRelations = await database
    .select()
    .from(postTags)
    .where(inArray(postTags.postId, postIds));
  const tagIds = Array.from(new Set(postTagRelations.map((relation) => relation.tagId))).filter(
    (value): value is number => value != null,
  );
  const tagRows = tagIds.length
    ? await database.select().from(tags).where(inArray(tags.id, tagIds))
    : [];
  const tagDetailsById = new Map<number, TagDetails>();
  for (const tagRow of tagRows)
    tagDetailsById.set(tagRow.id!, { id: tagRow.id!, name: tagRow.name!, norm: tagRow.norm! });
  const tagsByPostId = new Map<number, TagDetails[]>();
  for (const relation of postTagRelations) {
    const list = tagsByPostId.get(relation.postId) ?? [];
    const tag = relation.tagId != null ? tagDetailsById.get(relation.tagId) : undefined;
    if (tag) list.push(tag);
    tagsByPostId.set(relation.postId, list);
  }
  return tagsByPostId;
}

async function buildGameCategoriesByPostIdMap(postIds: number[]) {
  const database = getDatabase();
  if (postIds.length === 0) return new Map<number, GameCategoryDetails[]>();
  const postGameCategoryRelations = await database
    .select()
    .from(postGameCategories)
    .where(inArray(postGameCategories.postId, postIds));
  const categoryIds = Array.from(
    new Set(postGameCategoryRelations.map((relation) => relation.gameCategoryId)),
  ).filter((value): value is number => value != null);
  const categoryRows = categoryIds.length
    ? await database.select().from(gameCategories).where(inArray(gameCategories.id, categoryIds))
    : [];
  const gameCategoryDetailsById = new Map<number, GameCategoryDetails>();
  for (const categoryRow of categoryRows)
    gameCategoryDetailsById.set(categoryRow.id!, {
      id: categoryRow.id!,
      name: categoryRow.name!,
      displayName: categoryRow.displayName!,
    });
  const gameCategoriesByPostId = new Map<number, GameCategoryDetails[]>();
  for (const relation of postGameCategoryRelations) {
    const list = gameCategoriesByPostId.get(relation.postId) ?? [];
    const category =
      relation.gameCategoryId != null
        ? gameCategoryDetailsById.get(relation.gameCategoryId)
        : undefined;
    if (category) list.push(category);
    gameCategoriesByPostId.set(relation.postId, list);
  }
  return gameCategoriesByPostId;
}

async function buildUsersByIdMap(userIds: string[]) {
  const database = getDatabase();
  if (userIds.length === 0) return new Map<string, UserDetails>();
  const userRows = await database.select().from(users).where(inArray(users.id, userIds));
  const usersById = new Map<string, UserDetails>();
  for (const userRow of userRows)
    usersById.set(userRow.id!, {
      id: userRow.id!,
      name: userRow.name ?? null,
      image: userRow.image ?? null,
    });
  return usersById;
}

async function convertDatabaseRowsToPostCards(baseRows: PostDatabaseRow[]): Promise<Post[]> {
  const postIds = baseRows.map((post) => post.id);
  if (postIds.length === 0) return [];

  const uniqueUserIds = Array.from(
    new Set(baseRows.map((post) => post.userId).filter((value): value is string => !!value)),
  );
  const [tagsByPostId, gameCategoriesByPostId, usersById] = await Promise.all([
    buildTagsByPostIdMap(postIds),
    buildGameCategoriesByPostIdMap(postIds),
    buildUsersByIdMap(uniqueUserIds),
  ]);

  return baseRows.map<Post>((postRow) => ({
    id: postRow.id,
    title: postRow.title,
    content: postRow.content,
    excerpt: extractExcerptFromHtml(postRow.contentHtml),
    status: postRow.status,
    slug: postRow.slug,
    createdAt: postRow.createdAt as number,
    updatedAt: postRow.updatedAt as number,
    tags: tagsByPostId.get(postRow.id) ?? [],
    gameCategories: gameCategoriesByPostId.get(postRow.id) ?? [],
    user: postRow.userId ? usersById.get(postRow.userId) : undefined,
  }));
}

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
