import 'server-only';

import { inArray } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import {
  gameCategories,
  postGameCategories,
  postTags,
  posts,
  tags,
  users,
} from '@/db/schema';
import { getDatabase } from '@/lib/server/db';
import type { Post } from '@/lib/services/posts/types';

export type PostDatabaseRow = Pick<
  InferSelectModel<typeof posts>,
  | 'id'
  | 'title'
  | 'content'
  | 'contentHtml'
  | 'slug'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'userId'
>;

function extractExcerptFromHtml(html: string | null | undefined, maxLength = 120): string {
  const plainText = (html || '').replace(/<[^>]*>/g, '');
  return plainText.slice(0, maxLength);
}

async function buildTagsByPostIdMap(postIds: number[]) {
  const database = getDatabase();
  if (postIds.length === 0) return new Map<number, { id: number; name: string; norm: string }[]>();
  const postTagRelations = await database.select().from(postTags).where(inArray(postTags.postId, postIds));
  const tagIds = Array.from(new Set(postTagRelations.map((relation) => relation.tagId))).filter(
    (value): value is number => value != null,
  );
  const tagRows = tagIds.length ? await database.select().from(tags).where(inArray(tags.id, tagIds)) : [];
  const tagDetailsById = new Map<number, { id: number; name: string; norm: string }>();
  for (const tagRow of tagRows) {
    tagDetailsById.set(tagRow.id!, { id: tagRow.id!, name: tagRow.name!, norm: tagRow.norm! });
  }
  const tagsByPostId = new Map<number, { id: number; name: string; norm: string }[]>();
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
  if (postIds.length === 0)
    return new Map<number, { id: number; name: string; displayName: string }[]>();
  const postGameCategoryRelations = await database
    .select()
    .from(postGameCategories)
    .where(inArray(postGameCategories.postId, postIds));
  const categoryIds = Array.from(new Set(postGameCategoryRelations.map((relation) => relation.gameCategoryId))).filter(
    (value): value is number => value != null,
  );
  const categoryRows = categoryIds.length
    ? await database.select().from(gameCategories).where(inArray(gameCategories.id, categoryIds))
    : [];
  const gameCategoryDetailsById = new Map<number, { id: number; name: string; displayName: string }>();
  for (const categoryRow of categoryRows) {
    gameCategoryDetailsById.set(categoryRow.id!, {
      id: categoryRow.id!,
      name: categoryRow.name!,
      displayName: categoryRow.displayName!,
    });
  }
  const gameCategoriesByPostId = new Map<number, { id: number; name: string; displayName: string }[]>();
  for (const relation of postGameCategoryRelations) {
    const list = gameCategoriesByPostId.get(relation.postId) ?? [];
    const category = relation.gameCategoryId != null ? gameCategoryDetailsById.get(relation.gameCategoryId) : undefined;
    if (category) list.push(category);
    gameCategoriesByPostId.set(relation.postId, list);
  }
  return gameCategoriesByPostId;
}

async function buildUsersByIdMap(userIds: string[]) {
  const database = getDatabase();
  if (userIds.length === 0) return new Map<string, { id: string; name: string | null; image: string | null }>();
  const userRows = await database.select().from(users).where(inArray(users.id, userIds));
  const usersById = new Map<string, { id: string; name: string | null; image: string | null }>();
  for (const userRow of userRows) {
    usersById.set(userRow.id!, { id: userRow.id!, name: userRow.name ?? null, image: userRow.image ?? null });
  }
  return usersById;
}

export async function convertDatabaseRowsToPostCards(baseRows: PostDatabaseRow[]): Promise<Post[]> {
  const postIds = baseRows.map((post) => post.id);
  if (postIds.length === 0) return [] as Post[];

  const uniqueUserIds = Array.from(new Set(baseRows.map((post) => post.userId).filter((value): value is string => !!value)));

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

