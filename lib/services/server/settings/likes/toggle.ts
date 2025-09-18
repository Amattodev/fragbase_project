import 'server-only';

import { and, eq } from 'drizzle-orm';

import { likes } from '@/db/schema';
import { getDatabase } from '@/lib/server/db';

export async function toggleSettingLike(settingId: number, userIdentifier: string) {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.settingId, settingId), eq(likes.userIdentifier, userIdentifier)))
    .get();
  if (existing) {
    await db.delete(likes).where(and(eq(likes.settingId, settingId), eq(likes.userIdentifier, userIdentifier)));
    return { removed: true } as const;
  } else {
    await db.insert(likes).values({ settingId, userIdentifier });
    return { added: true } as const;
  }
}

