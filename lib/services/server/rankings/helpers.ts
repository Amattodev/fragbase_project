import { and, eq, gte, lte } from "drizzle-orm";

import { postComments, postLikes, posts } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

import { findOrCreateSnapshot, replaceEntries } from "./snapshots";

import type { RankingMetric, RankingPeriod, TimeWindow } from "./types";

/**
 * 安定ソート（Stable Sort）。
 * - 比較関数 cmp が同点(0)のときも入力順を保持するため、インデックスを第2キーに使う。
 */
export function stableSort<T>(arr: T[], cmp: (a: T, b: T) => number): T[] {
  return arr
    .map((v, i) => ({ v, i }))
    .sort((a, b) => {
      const r = cmp(a.v, b.v);
      return r !== 0 ? r : a.i - b.i;
    })
    .map(({ v }) => v);
}

/**
 * 公開記事の所有者マップを構築するヘルパー。
 * - 戻り値: Map<postId, userId>
 * - 「受け取ったいいね」をユーザーへ帰属させるために使用。
 */
export async function loadPublishedPostOwners(): Promise<Map<number, string>> {
  const db = getDatabase();
  const rows = await db.select().from(posts).where(eq(posts.status, "published"));
  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.id != null && r.userId) map.set(r.id as number, r.userId as string);
  }
  return map;
}

/** 公開記事IDの集合を取得 */
export async function listPublishedPostIdsSet(): Promise<Set<number>> {
  const db = getDatabase();
  const rows = await db.select().from(posts).where(eq(posts.status, 'published'));
  return new Set(rows.map((r) => r.id as number));
}

/** ユーザー単位の配列データ（cnt, latest 付き）に変換 */
export function toUserItems(counts: {
  countByUser: Map<string, number>;
  latestByUser: Map<string, number>;
}) {
  return Array.from(counts.countByUser.entries()).map(([userId, cnt]) => ({
    userId,
    cnt,
    latest: counts.latestByUser.get(userId) || 0,
  }));
}

/** 指標値 desc → 最新イベント desc → userId asc で安定ソートし、上位N件を返す */
export function sortUserItems(
  items: Array<{ userId: string; cnt: number; latest: number }>,
  topN: number,
) {
  return stableSort(items, (a, b) => {
    if (b.cnt !== a.cnt) return b.cnt - a.cnt;
    if (b.latest !== a.latest) return b.latest - a.latest;
    return a.userId.localeCompare(b.userId);
  }).slice(0, topN);
}

/** metric に応じてエントリーのカウント列名を切り替え、スナップショットへ保存 */
export async function saveUserSnapshot(
  metric: RankingMetric,
  period: RankingPeriod,
  window: TimeWindow,
  items: Array<{ userId: string; cnt: number; latest: number }>,
) {
  const snapshot = await findOrCreateSnapshot({ kind: "user", metric, period, window });
  type UserEntryInsert = {
    rank: number;
    userId: string;
    postsCount?: number;
    commentsCount?: number;
    likesCount?: number;
  };
  const values: UserEntryInsert[] = items.map((it, idx) => {
    const base: UserEntryInsert = { rank: idx + 1, userId: it.userId };
    if (metric === "posts") {
      base.postsCount = it.cnt;
    } else if (metric === "comments") {
      base.commentsCount = it.cnt;
    } else {
      base.likesCount = it.cnt;
    }
    return base;
  });
  await replaceEntries(snapshot.id as number, values);
}

/** 週内コメント（公開記事へのもの）をユーザー単位に集計 */
export async function computeWeeklyCommentsCounts(window: TimeWindow) {
  const db = getDatabase();
  const publishedPostIds = await listPublishedPostIdsSet();
  const rows = await db
    .select()
    .from(postComments)
    .where(
      and(gte(postComments.createdAt, window.start ?? 0), lte(postComments.createdAt, window.end)),
    );
  const countByUser = new Map<string, number>();
  const latestByUser = new Map<string, number>();
  for (const c of rows) {
    if (!c.userIdentifier) continue; // 匿名は集計対象外
    if (!publishedPostIds.has(c.postId as number)) continue; // 公開記事へのコメントのみ
    const uid = c.userIdentifier as string;
    countByUser.set(uid, (countByUser.get(uid) || 0) + 1);
    const t = (c.createdAt || 0) as number;
    latestByUser.set(uid, Math.max(latestByUser.get(uid) || 0, t));
  }
  return { countByUser, latestByUser };
}

/** 週内に受け取ったいいね（公開記事の所有者に帰属）をユーザー単位に集計 */
export async function computeWeeklyLikesCounts(window: TimeWindow) {
  const db = getDatabase();
  const ownersMap = await loadPublishedPostOwners();
  const rows = await db
    .select()
    .from(postLikes)
    .where(and(gte(postLikes.createdAt, window.start ?? 0), lte(postLikes.createdAt, window.end)));
  const countByUser = new Map<string, number>();
  const latestByUser = new Map<string, number>();
  for (const l of rows) {
    const owner = ownersMap.get(l.postId as number);
    if (!owner) continue;
    countByUser.set(owner, (countByUser.get(owner) || 0) + 1);
    const t = (l.createdAt || 0) as number;
    latestByUser.set(owner, Math.max(latestByUser.get(owner) || 0, t));
  }
  return { countByUser, latestByUser };
}

/** 週内公開記事から投稿数と最新投稿時刻をユーザー単位に集計 */
export async function computeWeeklyPostsCounts(window: TimeWindow) {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.status, "published"),
        gte(posts.createdAt, window.start ?? 0),
        lte(posts.createdAt, window.end),
      ),
    );
  const countByUser = new Map<string, number>();
  const latestByUser = new Map<string, number>();
  for (const p of rows) {
    const uid = (p.userId || "") as string;
    if (!uid) continue;
    countByUser.set(uid, (countByUser.get(uid) || 0) + 1);
    const t = (p.createdAt || 0) as number;
    latestByUser.set(uid, Math.max(latestByUser.get(uid) || 0, t));
  }
  return { countByUser, latestByUser };
}

/** AllTime: 公開記事から投稿数と最新投稿時刻をユーザー単位に集計 */
export async function computeAllTimePostsCounts() {
  const db = getDatabase();
  const rows = await db.select().from(posts).where(eq(posts.status, "published"));
  const countByUser = new Map<string, number>();
  const latestByUser = new Map<string, number>();
  for (const p of rows) {
    const uid = (p.userId || "") as string;
    if (!uid) continue;
    countByUser.set(uid, (countByUser.get(uid) || 0) + 1);
    const t = (p.createdAt || 0) as number;
    latestByUser.set(uid, Math.max(latestByUser.get(uid) || 0, t));
  }
  return { countByUser, latestByUser };
}

/** AllTime: 公開記事へのコメントをユーザー単位に集計 */
export async function computeAllTimeCommentsCounts() {
  const db = getDatabase();
  const publishedPostIds = await listPublishedPostIdsSet();
  const rows = await db.select().from(postComments);
  const countByUser = new Map<string, number>();
  const latestByUser = new Map<string, number>();
  for (const c of rows) {
    if (!c.userIdentifier) continue;
    if (!publishedPostIds.has(c.postId as number)) continue;
    const uid = c.userIdentifier as string;
    countByUser.set(uid, (countByUser.get(uid) || 0) + 1);
    const t = (c.createdAt || 0) as number;
    latestByUser.set(uid, Math.max(latestByUser.get(uid) || 0, t));
  }
  return { countByUser, latestByUser };
}

/** AllTime: 受け取ったいいね（公開記事所有者に帰属）をユーザー単位に集計 */
export async function computeAllTimeLikesCounts() {
  const db = getDatabase();
  const ownersMap = await loadPublishedPostOwners();
  const rows = await db.select().from(postLikes);
  const countByUser = new Map<string, number>();
  const latestByUser = new Map<string, number>();
  for (const l of rows) {
    const owner = ownersMap.get(l.postId as number);
    if (!owner) continue;
    countByUser.set(owner, (countByUser.get(owner) || 0) + 1);
    const t = (l.createdAt || 0) as number;
    latestByUser.set(owner, Math.max(latestByUser.get(owner) || 0, t));
  }
  return { countByUser, latestByUser };
}
