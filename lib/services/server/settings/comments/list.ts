import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { comments } from '@/db/schema';
import { getDatabase } from '@/lib/server/db';

import type { Comment } from '../types';

export async function getSettingComments(settingId: number) {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.settingId, settingId))
    .orderBy(desc(comments.createdAt))
    .all();
  return rows.map((c: Comment) => ({
    id: c.id,
    settingId: c.settingId,
    content: c.content,
    author: c.author || '匿名ユーザー',
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('ja-JP') : '',
  }));
}

