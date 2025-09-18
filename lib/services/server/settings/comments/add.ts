import 'server-only';

import { comments } from '@/db/schema';
import { getDatabase } from '@/lib/server/db';

export async function addSettingComment(settingId: number, content: string, author?: string | null) {
  const db = getDatabase();
  const result = await db
    .insert(comments)
    .values({ settingId, content: content.trim(), author: author || null })
    .returning();
  const inserted = result[0];
  return {
    id: inserted.id,
    settingId: inserted.settingId,
    content: inserted.content,
    author: inserted.author || '匿名ユーザー',
    createdAt: inserted.createdAt ? new Date(inserted.createdAt).toLocaleDateString('ja-JP') : '',
  };
}

