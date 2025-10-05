import { and, eq } from "drizzle-orm";

import { rankingEntries, rankingSnapshots } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

import type { RankingKind, RankingMetric, RankingPeriod, TimeWindow } from "./types";

//ランキング作成
export async function findOrCreateSnapshot(args: {
  kind: RankingKind;
  metric: RankingMetric;
  period: RankingPeriod;
  window: TimeWindow;
}) {
  const db = getDatabase();
  const { kind, metric, period, window } = args;
  const existing = await db
    .select()
    .from(rankingSnapshots)
    .where(
      and(
        eq(rankingSnapshots.kind, kind),
        eq(rankingSnapshots.metric, metric),
        eq(rankingSnapshots.period, period),
        eq(rankingSnapshots.windowEnd, window.end),
      ),
    );
  if (existing.length > 0) return existing[0];

  await db.insert(rankingSnapshots).values({
    kind,
    metric,
    period,
    windowStart: window.start ?? null,
    windowEnd: window.end,
    computedAt: Date.now(),
  });
  const created = await db
    .select()
    .from(rankingSnapshots)
    .where(
      and(
        eq(rankingSnapshots.kind, kind),
        eq(rankingSnapshots.metric, metric),
        eq(rankingSnapshots.period, period),
        eq(rankingSnapshots.windowEnd, window.end),
      ),
    );
  return created[0];
}

//ランキング順位データ入れ替え
export async function replaceEntries(
  snapshotId: number,
  values: Array<{
    rank: number;
    postId?: number | null;
    userId?: string | null;
    likesCount?: number;
    postsCount?: number;
    commentsCount?: number;
  }>,
) {
  const db = getDatabase();
  // Clear existing
  await db.delete(rankingEntries).where(eq(rankingEntries.snapshotId, snapshotId));
  if (values.length === 0) return;
  await db.insert(rankingEntries).values(
    values.map((v) => ({
      snapshotId,
      rank: v.rank,
      postId: v.postId ?? null,
      userId: v.userId ?? null,
      likesCount: v.likesCount ?? 0,
      postsCount: v.postsCount ?? 0,
      commentsCount: v.commentsCount ?? 0,
    })),
  );
}
