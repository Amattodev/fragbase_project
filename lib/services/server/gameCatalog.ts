import 'server-only';
import { and, eq, like } from 'drizzle-orm';

import { gameCategories } from '@/db/schema';
import { GAMES } from '@/constants/games';
import { getDatabase } from '@/lib/server/db';

export async function syncGamesFromConstants() {
  const db = getDatabase();
  const existing = await db.select().from(gameCategories).all();

  // 1) Backfill slug for rows without slug by matching display/name to constants
  for (const row of existing) {
    if (!row.slug || row.slug.length === 0) {
      const match = GAMES.find((g) =>
        equalsIgnoreCase(row.name, g.nameEn) || equalsIgnoreCase(row.displayName, g.nameEn),
      );
      if (match) {
        await db.update(gameCategories).set({ slug: match.slug }).where(eq(gameCategories.id, row.id));
      }
    }
  }

  // 2) Upsert constants → DB
  for (const g of GAMES) {
    const found = await db.select().from(gameCategories).where(eq(gameCategories.slug, g.slug)).get();
    if (found) {
      // Keep names in sync (do not override user edits aggressively beyond name/display)
      await db
        .update(gameCategories)
        .set({ name: g.nameEn, displayName: g.nameEn })
        .where(eq(gameCategories.id, found.id));
    } else {
      await db
        .insert(gameCategories)
        .values({ slug: g.slug, name: g.nameEn, displayName: g.nameEn, createdAt: Date.now() });
    }
  }

  return { ok: true, count: GAMES.length } as const;
}

function equalsIgnoreCase(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

