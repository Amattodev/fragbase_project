import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import { DEFAULT_SETTINGS_PAGE_SIZE } from '@/constants/pagination';
import { likes, settings } from '@/db/schema';
import { getDatabase } from '@/lib/server/db';

import { transformSetting } from './mapper';

import type { SettingsListFilters } from './types';


export async function getSettingsList(filters: SettingsListFilters) {
  const db = getDatabase();
  const limit = filters.limit ?? DEFAULT_SETTINGS_PAGE_SIZE;
  const offset = filters.offset ?? 0;

  const whereConds = [] as any[];
  if (filters.game) whereConds.push(eq(settings.game, filters.game));
  if (filters.fpsExperience) whereConds.push(eq(settings.fpsExperience, filters.fpsExperience));
  if (filters.role) whereConds.push(eq(settings.role, filters.role));
  if (filters.character) whereConds.push(eq(settings.character, filters.character));
  if (filters.device) whereConds.push(eq(settings.device, filters.device));

  const base = db.select().from(settings).orderBy(desc(settings.createdAt)).limit(limit + 1).offset(offset);
  const rows =
    whereConds.length > 0
      ? await base.where(whereConds.length === 1 ? whereConds[0] : and(...whereConds)).all()
      : await base.all();

  const hasMore = rows.length > limit;
  const actual = hasMore ? rows.slice(0, limit) : rows;

  const withLikes = await Promise.all(
    actual.map(async (s) => {
      const likeRows = await db.select().from(likes).where(eq(likes.settingId, s.id)).all();
      return transformSetting(s, likeRows.length || 0);
    }),
  );

  return {
    data: withLikes,
    pagination: {
      limit,
      offset,
      hasMore,
      currentPage: Math.floor(offset / limit) + 1,
    },
  } as const;
}
