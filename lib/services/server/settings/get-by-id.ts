import 'server-only';

import { eq } from 'drizzle-orm';

import { likes, settings } from '@/db/schema';
import { getDatabase } from '@/lib/server/db';

import { transformSetting } from './mapper';

export async function getSettingById(id: number) {
  const db = getDatabase();
  const row = await db.select().from(settings).where(eq(settings.id, id)).get();
  if (!row) return null;
  const likeRows = await db.select().from(likes).where(eq(likes.settingId, id)).all();
  return transformSetting(row, likeRows.length || 0);
}

