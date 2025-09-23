import 'server-only';
import { and, desc, eq, ne } from 'drizzle-orm';
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
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      image: users.image,
      updatedAt: userGameProfiles.updatedAt,
    })
    .from(userGameProfiles)
    .leftJoin(users, eq(users.id, userGameProfiles.userId))
    .where(
      and(
        eq(userGameProfiles.gameSlug, slug),
        exclude ? ne(userGameProfiles.userId, exclude) : eq(userGameProfiles.userId, userGameProfiles.userId),
      ),
    )
    .orderBy(desc(userGameProfiles.updatedAt), desc(users.id))
    .limit(limit);

  return rows
    .filter((r): r is Required<typeof r> => Boolean(r.id && r.username))
    .map((r) => ({ id: r.id, username: r.username!, name: r.name ?? null, image: r.image ?? null, updatedAt: r.updatedAt ?? 0 }));
}

