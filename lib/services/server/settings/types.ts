import { comments, settings } from '@/db/schema';

import type { InferSelectModel } from 'drizzle-orm';

export type Setting = InferSelectModel<typeof settings>;
export type Comment = InferSelectModel<typeof comments>;

export type SettingsListFilters = {
  game?: string | null;
  fpsExperience?: string | null;
  role?: string | null;
  character?: string | null;
  device?: string | null;
  limit?: number;
  offset?: number;
};

export type CreateSettingInput = {
  game: string;
  role: string;
  dpi: number;
  comment?: string | null;
  fpsExperience: string;
  character?: string | null;
  device?: string | null;
  gameSpecificSettings: Record<string, unknown>;
};

