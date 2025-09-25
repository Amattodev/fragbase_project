import 'server-only';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { getDatabase } from '@/lib/server/db';
import { userGameProfiles, users } from '@/db/schema';
import type { GamePlayer } from './types';

export async function listPlayersByGame(
  slug: string,
  opts?: { excludeUserId?: string; limit?: number },
): Promise<GamePlayer[]> {
  const db = getDatabase();
  const limit = Math.max(1, Math.min(opts?.limit ?? 48, 200));
  const exclude = opts?.excludeUserId;
  // Step 1: pick recent profile rows
  const ugp = await db
    .select()
    .from(userGameProfiles)
    .where(
      and(
        eq(userGameProfiles.gameSlug, slug),
        exclude ? ne(userGameProfiles.userId, exclude) : eq(userGameProfiles.userId, userGameProfiles.userId),
      ),
    )
    .orderBy(desc(userGameProfiles.updatedAt))
    .limit(limit);

  const userIds = Array.from(new Set(ugp.map((r) => r.userId).filter(Boolean))) as string[];
  if (userIds.length === 0) return [];

  // Step 2: fetch user rows in bulk
  const urows = await db.select().from(users).where(inArray(users.id, userIds));
  const byId = new Map(urows.map((u) => [u.id, u] as const));

  // Step 3: map in the same order as ugp (updatedAt desc)
  const result: GamePlayer[] = [];
  for (const r of ugp) {
    const u = r.userId ? byId.get(r.userId) : undefined;
    if (!u || !u.username) continue;
    result.push({ id: u.id!, username: u.username!, name: u.name ?? null, image: u.image ?? null, updatedAt: r.updatedAt ?? 0 });
  }
  return result;
}
