import 'client-only';

export type CreateSettingPayload = {
  game: string;
  fpsExperience: string;
  role: string;
  character?: string;
  dpi: number;
  device: string;
  comment?: string;
  sliders?: Record<string, number>;
  selects?: Record<string, string>;
};

export async function createSetting(
  payload: CreateSettingPayload,
): Promise<{ ok: boolean; id?: number; errors?: string }> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return (await res.json()) as { ok: boolean; id?: number; errors?: string };
}

