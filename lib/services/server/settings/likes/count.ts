import 'server-only';

import { eq } from 'drizzle-orm';

import { likes } from '@/db/schema';
import { getDatabase } from '@/lib/server/db';

export async function getSettingLikesCount(settingId: number) {
  const db = getDatabase();
  const rows = await db.select().from(likes).where(eq(likes.settingId, settingId)).all();
  return rows.length;
}

