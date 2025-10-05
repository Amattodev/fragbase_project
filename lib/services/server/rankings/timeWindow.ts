import { TimeWindow } from "./types";

//前週分データ取得
export function getPreviousWeekWindowJST(nowMs = Date.now()): TimeWindow {
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  const nowJst = new Date(nowMs + JST_OFFSET);
  const day = nowJst.getUTCDay(); // 0=Sun,1=Mon,... in JST context
  const daysSinceMonday = (day + 6) % 7; // Mon=0, Sun=6
  // start of current week (Mon 00:00 JST)
  const startOfThisWeekJst =
    Date.UTC(nowJst.getUTCFullYear(), nowJst.getUTCMonth(), nowJst.getUTCDate(), 0, 0, 0) -
    daysSinceMonday * 24 * 60 * 60 * 1000;
  const startOfPrevWeekJst = startOfThisWeekJst - 7 * 24 * 60 * 60 * 1000;
  const endOfPrevWeekJst = startOfThisWeekJst - 1; // Sun 23:59:59.999 JST
  // convert back to UTC ms by subtracting offset
  return { start: startOfPrevWeekJst - JST_OFFSET, end: endOfPrevWeekJst - JST_OFFSET };
}
