import { getPreviousWeekWindowJST } from './timeWindow';
import { buildArticleAllTime, buildArticleWeekly } from './articles';
import { buildUserAllTime, buildUserWeekly } from './users';
import { TOP_N_DEFAULT } from './types';

/**
 * 週次ジョブのエントリーポイント。
 * - 前週ウィンドウを算出し、記事(Weekly/AllTime) と ユーザー(Weekly/AllTime) のスナップショットを順に再計算
 */
export async function rebuildAllSnapshots(topN = TOP_N_DEFAULT) {
  const weeklyWindow = getPreviousWeekWindowJST();
  await buildArticleWeekly(weeklyWindow, topN);
  await buildArticleAllTime(weeklyWindow.end, topN);
  await buildUserWeekly(weeklyWindow, topN);
  await buildUserAllTime(weeklyWindow.end, topN);
  return { ok: true, weeklyWindow } as const;
}

