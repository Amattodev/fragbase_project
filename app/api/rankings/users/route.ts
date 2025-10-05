import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { rankingEntries, rankingSnapshots, users } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

type Period = "weekly" | "alltime";
type Metric = "posts" | "comments" | "likes";
type UserSummary = { id: string; username: string | null; name: string | null; image: string | null };

function parsePeriod(value: string | null): Period {
  return value === "alltime" ? "alltime" : "weekly";
}

function parseMetric(value: string | null): Metric {
  return value === "comments" || value === "likes" ? value : "posts";
}

function parseIntParam(value: string | null, def: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const period = parsePeriod(url.searchParams.get("period"));
    const metric = parseMetric(url.searchParams.get("metric"));
    const limit = parseIntParam(url.searchParams.get("limit"), 20, 1, 50);
    const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 1000);

    const db = getDatabase();

    const baseSnaps = await db
      .select()
      .from(rankingSnapshots)
      .where(and(eq(rankingSnapshots.kind, "user"), eq(rankingSnapshots.metric, metric), eq(rankingSnapshots.period, period)))
      .orderBy(desc(rankingSnapshots.windowEnd));

    if (baseSnaps.length === 0) {
      return new Response(JSON.stringify({ ok: true, period, metric, window: null, items: [] }), {
        headers: { "content-type": "application/json" },
      });
    }

    const base = baseSnaps[0];
    const windowEnd = base.windowEnd as number;

    const altMetrics: Metric[] = ["posts", "comments", "likes"];
    const snapByMetric = new Map<Metric, number | null>();
    for (const m of altMetrics) snapByMetric.set(m, null);

    const siblings = await db
      .select()
      .from(rankingSnapshots)
      .where(and(eq(rankingSnapshots.kind, "user"), eq(rankingSnapshots.period, period), eq(rankingSnapshots.windowEnd, windowEnd)));
    for (const s of siblings) {
      const m = (s.metric as Metric) || "posts";
      if (snapByMetric.has(m)) snapByMetric.set(m, s.id as number);
    }

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

    for (const m of altMetrics) {
      const sid = snapByMetric.get(m);
      if (!sid) continue;
      const rows = await db.select().from(rankingEntries).where(eq(rankingEntries.snapshotId, sid)).orderBy(asc(rankingEntries.rank));
      for (const r of rows) {
        const uid = (r.userId || "") as string;
        if (!uid) continue;
        const v = m === "posts" ? r.postsCount ?? 0 : m === "comments" ? r.commentsCount ?? 0 : r.likesCount ?? 0;
        counts[m].set(uid, v);
      }
    }

    const userIds = baseEntries.map((e) => e.userId as string).filter(Boolean);
    const uniqUserIds = Array.from(new Set(userIds));
    const userRows = uniqUserIds.length ? await db.select().from(users).where(inArray(users.id, uniqUserIds)) : [];
    const userMap = new Map<string, (typeof userRows)[number]>();
    for (const u of userRows) userMap.set(u.id as string, u);

    const allItems = baseEntries
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

    const paged = allItems.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        ok: true,
        period,
        metric,
        window: { start: base.windowStart, end: base.windowEnd, computedAt: base.computedAt },
        items: paged,
      }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ ok: false, error: message, items: [], window: null }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
