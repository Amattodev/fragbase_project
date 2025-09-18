import 'server-only';

import { getDeviceLabel } from '@/constants/device';
import { getDpiLabel } from '@/constants/dpi';
import { getFpsExperienceLabel } from '@/constants/fpsExperience';
import { getRoleLabel } from '@/constants/role';

import type { Setting } from './types';

type GameSpecificSettings = {
  sensitivity?: number;
  aimSensitivity?: number;
  reactcurve?: string;
  deadZone?: string;
  scopedSensitivity?: number;
  aimAssist?: string;
  [key: string]: any;
};

export function transformSetting(row: Setting, likesCount: number) {
  let gameSpecificSettings: GameSpecificSettings = {};
  try {
    gameSpecificSettings = row.gameSpecificSettings
      ? (JSON.parse(row.gameSpecificSettings) as GameSpecificSettings)
      : {};
  } catch {
    // ignore malformed json
  }

  const roleLabel = getRoleLabel(row.game, row.role);
  const fpsExperienceLabel = getFpsExperienceLabel(row.fpsExperience);
  const dpiLabel = getDpiLabel(row.dpi);
  const deviceLabel = getDeviceLabel(row.device || 'マウス');

  const baseData = {
    id: row.id,
    gameTitle: row.game,
    role: roleLabel,
    dpi: dpiLabel,
    comment: row.comment || '',
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : '',
    fpsExperience: fpsExperienceLabel,
    character: row.character || '不明',
    device: deviceLabel,
    likesCount,
  } as const;

  switch (row.game) {
    case 'APEX':
      return {
        ...baseData,
        sensitivity: gameSpecificSettings.sensitivity ?? 0,
        aimSensitivity: gameSpecificSettings.aimSensitivity ?? 0,
        reactcurve: gameSpecificSettings.reactcurve ?? 'リニア',
        deadZone: gameSpecificSettings.deadZone ?? 'なし',
      } as const;
    case 'VALORANT':
      return {
        ...baseData,
        sensitivity: gameSpecificSettings.sensitivity ?? 0,
      } as const;
    case 'OVERWATCH2':
      return {
        ...baseData,
        sensitivity: gameSpecificSettings.sensitivity ?? 0,
        scopedSensitivity: gameSpecificSettings.scopedSensitivity ?? 0,
        aimAssist: gameSpecificSettings.aimAssist ?? '50%',
      } as const;
    default:
      return { ...baseData, sensitivity: 0 } as const;
  }
}

