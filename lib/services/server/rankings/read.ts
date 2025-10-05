import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { posts, rankingEntries, rankingSnapshots, users } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

export type Period = "weekly" | "alltime";
export type Metric = "posts" | "comments" | "likes";

export type UserSummary = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

// TODO:他の機能でもサーバー側からDBを読み込むようにするか検討

export async function readArticleRankings(period: Period, limit = 20, offset = 0) {
  const db = getDatabase();
  try {
    const snaps = await db
      .select()
      .from(rankingSnapshots)
      .where(
        and(
          eq(rankingSnapshots.kind, "article"),
          eq(rankingSnapshots.metric, "likes"),
          eq(rankingSnapshots.period, period),
        ),
      )
      .orderBy(desc(rankingSnapshots.windowEnd));
    if (snaps.length === 0) return { ok: true as const, window: null, items: [] as any[] };

    const snap = snaps[0];
    const entries = await db
      .select()
      .from(rankingEntries)
      .where(eq(rankingEntries.snapshotId, snap.id as number))
      .orderBy(asc(rankingEntries.rank));

    const postIds = entries.map((e) => e.postId as number).filter(Boolean);
    const postRows = postIds.length
      ? await db
          .select()
          .from(posts)
          .where(and(inArray(posts.id, postIds), eq(posts.status, "published")))
      : [];
    const postMap = new Map<number, (typeof postRows)[number]>();
    for (const p of postRows) postMap.set(p.id as number, p);

    const authorIds = Array.from(new Set(postRows.map((p) => p.userId as string).filter(Boolean)));
    const userRows = authorIds.length
      ? await db.select().from(users).where(inArray(users.id, authorIds))
      : [];
    const userMap = new Map<string, (typeof userRows)[number]>();
    for (const u of userRows) userMap.set(u.id as string, u);

    const items = entries
      .map((e) => {
        const p = postMap.get(e.postId as number);
        if (!p) return null;
        const u = p.userId ? userMap.get(p.userId as string) : undefined;
        return {
          rank: e.rank,
          likesCount: e.likesCount ?? 0,
          post: {
            id: p.id as number,
            title: p.title as string,
            createdAt: p.createdAt as number,
            user: u
              ? ({ id: u.id, username: u.username, name: u.name, image: u.image } as UserSummary)
              : null,
          },
        };
      })
      .filter(Boolean) as Array<{
      rank: number;
      likesCount: number;
      post: { id: number; title: string; createdAt: number; user: UserSummary | null } | null;
    }>;

    const paged = items.slice(offset, offset + limit);
    return {
      ok: true as const,
      window: { start: snap.windowStart, end: snap.windowEnd, computedAt: snap.computedAt },
      items: paged,
    };
  } catch (e) {
    return { ok: false as const, window: null, items: [] as any[] };
  }
}

export async function readUserRankings(metric: Metric, period: Period, limit = 20, offset = 0) {
  const db = getDatabase();
  try {
    const baseSnaps = await db
      .select()
      .from(rankingSnapshots)
      .where(
        and(
          eq(rankingSnapshots.kind, "user"),
          eq(rankingSnapshots.metric, metric),
          eq(rankingSnapshots.period, period),
        ),
      )
      .orderBy(desc(rankingSnapshots.windowEnd));
    if (baseSnaps.length === 0) return { ok: true as const, window: null, items: [] as any[] };

    const base = baseSnaps[0];
    const windowEnd = base.windowEnd as number;
    const alt: Metric[] = ["posts", "comments", "likes"];
    const snapIdByMetric = new Map<Metric, number | null>(alt.map((m) => [m, null]));
    const siblings = await db
      .select()
      .from(rankingSnapshots)
      .where(
        and(
          eq(rankingSnapshots.kind, "user"),
          eq(rankingSnapshots.period, period),
          eq(rankingSnapshots.windowEnd, windowEnd),
        ),
      );
    for (const s of siblings) snapIdByMetric.set((s.metric as Metric) || "posts", s.id as number);

    const baseEntries = await db
      .select()
      .from(rankingEntries)
      .where(eq(rankingEntries.snapshotId, base.id as number))
      .orderBy(asc(rankingEntries.rank));

    const counts = {
      posts: new Map<string, number>(),
      comments: new Map<string, number>(),
      likes: new Map<string, number>(),
    } as const;
    for (const m of alt) {
      const sid = snapIdByMetric.get(m);
      if (!sid) continue;
      const rows = await db
        .select()
        .from(rankingEntries)
        .where(eq(rankingEntries.snapshotId, sid))
        .orderBy(asc(rankingEntries.rank));
      for (const r of rows) {
        const uid = (r.userId || "") as string;
        if (!uid) continue;
        const v =
          m === "posts"
            ? (r.postsCount ?? 0)
            : m === "comments"
              ? (r.commentsCount ?? 0)
              : (r.likesCount ?? 0);
        counts[m].set(uid, v);
      }
    }

    const userIds = baseEntries.map((e) => e.userId as string).filter(Boolean);
    const uniqUserIds = Array.from(new Set(userIds));
    const userRows = uniqUserIds.length
      ? await db.select().from(users).where(inArray(users.id, uniqUserIds))
      : [];
    const userMap = new Map<string, (typeof userRows)[number]>();
    for (const u of userRows) userMap.set(u.id as string, u);

    const items = baseEntries
      .map((e) => {
        const u = userMap.get((e.userId || "") as string);
        if (!u) return null;
        const uid = u.id as string;
        return {
          rank: e.rank,
          user: { id: uid, username: u.username, name: u.name, image: u.image } as UserSummary,
          postsCount: counts.posts.get(uid) || 0,
          commentsCount: counts.comments.get(uid) || 0,
          likesCount: counts.likes.get(uid) || 0,
        };
      })
      .filter(Boolean) as Array<{
      rank: number;
      user: UserSummary;
      postsCount: number;
      commentsCount: number;
      likesCount: number;
    }>;

    const paged = items.slice(offset, offset + limit);
    return {
      ok: true as const,
      window: { start: base.windowStart, end: base.windowEnd, computedAt: base.computedAt },
      items: paged,
    };
  } catch (e) {
    return { ok: false as const, window: null, items: [] as any[] };
  }
}
