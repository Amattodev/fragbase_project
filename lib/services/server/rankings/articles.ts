import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { postLikes, posts } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

import { stableSort } from "./helpers";
import { findOrCreateSnapshot, replaceEntries } from "./snapshots";
import { TOP_N_DEFAULT, TimeWindow } from "./types";

export async function buildArticleWeekly(window: TimeWindow, topN = TOP_N_DEFAULT) {
  const db = getDatabase();
  const publishedPosts = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.status, "published"),
        gte(posts.createdAt, window.start ?? 0),
        lte(posts.createdAt, window.end),
      ),
    )
    .orderBy(desc(posts.createdAt));

  const postIds = publishedPosts.map((p) => p.id);
  const likes = postIds.length
    ? await db
        .select()
        .from(postLikes)
        .where(
          and(
            inArray(postLikes.postId, postIds as number[]),
            gte(postLikes.createdAt, window.start ?? 0),
            lte(postLikes.createdAt, window.end),
          ),
        )
    : [];

  const likeCountByPost = new Map<number, number>();
  for (const l of likes) likeCountByPost.set(l.postId, (likeCountByPost.get(l.postId) || 0) + 1);

  const items = publishedPosts.map((p) => ({
    postId: p.id as number,
    likes: likeCountByPost.get(p.id) || 0,
    publishedAt: p.createdAt as number,
  }));

  const sorted = stableSort(items, (a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    if (b.publishedAt !== a.publishedAt) return (b.publishedAt || 0) - (a.publishedAt || 0);
    return a.postId - b.postId;
  }).slice(0, topN);

  const snapshot = await findOrCreateSnapshot({
    kind: "article",
    metric: "likes",
    period: "weekly",
    window,
  });
  await replaceEntries(
    snapshot.id as number,
    sorted.map((it, idx) => ({ rank: idx + 1, postId: it.postId, likesCount: it.likes })),
  );
}

export async function buildArticleAllTime(windowEnd: number, topN = TOP_N_DEFAULT) {
  const db = getDatabase();
  const publishedPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.createdAt));

  const postIds = publishedPosts.map((p) => p.id);
  const likes = postIds.length
    ? await db
        .select()
        .from(postLikes)
        .where(inArray(postLikes.postId, postIds as number[]))
    : [];

  const likeCountByPost = new Map<number, number>();
  for (const l of likes) likeCountByPost.set(l.postId, (likeCountByPost.get(l.postId) || 0) + 1);

  const items = publishedPosts.map((p) => ({
    postId: p.id as number,
    likes: likeCountByPost.get(p.id) || 0,
    publishedAt: p.createdAt as number,
  }));

  const sorted = stableSort(items, (a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    if (b.publishedAt !== a.publishedAt) return (b.publishedAt || 0) - (a.publishedAt || 0);
    return a.postId - b.postId;
  }).slice(0, topN);

  const snapshot = await findOrCreateSnapshot({
    kind: "article",
    metric: "likes",
    period: "alltime",
    window: { start: null, end: windowEnd },
  });
  await replaceEntries(
    snapshot.id as number,
    sorted.map((it, idx) => ({ rank: idx + 1, postId: it.postId, likesCount: it.likes })),
  );
}
