import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { posts, rankingEntries, rankingSnapshots, users } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

type Period = "weekly" | "alltime";
type UserSummary = { id: string; username: string | null; name: string | null; image: string | null };

function parsePeriod(value: string | null): Period {
  return value === "alltime" ? "alltime" : "weekly";
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
    const limit = parseIntParam(url.searchParams.get("limit"), 20, 1, 50);
    const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 1000);

    const db = getDatabase();

    const snapshots = await db
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

    if (snapshots.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, period, window: null, items: [] }),
        { headers: { "content-type": "application/json" } },
      );
    }

    const snapshot = snapshots[0];

    const entries = await db
      .select()
      .from(rankingEntries)
      .where(eq(rankingEntries.snapshotId, snapshot.id as number))
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

    const allItems = entries
      .map((e) => {
        const p = postMap.get(e.postId as number);
        if (!p) return null;
        const u = p.userId ? userMap.get(p.userId as string) : undefined;
        return {
          rank: e.rank,
          likesCount: e.likesCount ?? 0,
          post: {
            id: p.id,
            title: p.title,
            createdAt: p.createdAt,
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

    const paged = allItems.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        ok: true,
        period,
        window: { start: snapshot.windowStart, end: snapshot.windowEnd, computedAt: snapshot.computedAt },
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
