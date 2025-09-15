import 'server-only';

import { settings } from '@/db/schema';
import { getDatabase } from '@/lib/server/db';

import type { CreateSettingInput } from './types';

export async function createSetting(input: CreateSettingInput) {
  const db = getDatabase();
  const result = await db
    .insert(settings)
    .values({
      game: input.game,
      role: input.role,
      dpi: input.dpi,
      comment: input.comment ?? null,
      fpsExperience: input.fpsExperience,
      character: input.character ?? null,
      device: input.device ?? null,
      gameSpecificSettings: JSON.stringify(input.gameSpecificSettings ?? {}),
    })
    .returning();
  return result[0]?.id as number;
}

