import {
  computeAllTimeCommentsCounts,
  computeAllTimeLikesCounts,
  computeAllTimePostsCounts,
  computeWeeklyCommentsCounts,
  computeWeeklyLikesCounts,
  computeWeeklyPostsCounts,
  saveUserSnapshot,
  sortUserItems,
  toUserItems,
} from "./helpers";
import { TOP_N_DEFAULT, TimeWindow } from "./types";

/**
 * ユーザーランキング（Weekly, 3指標）を構築し保存する。
 * - 投稿数/コメント数/受け取ったいいね をそれぞれ個別のスナップショットに保存。
 */
export async function buildUserWeekly(window: TimeWindow, topN = TOP_N_DEFAULT) {
  const postsCounts = await computeWeeklyPostsCounts(window);
  const commentsCounts = await computeWeeklyCommentsCounts(window);
  const likesCounts = await computeWeeklyLikesCounts(window);

  const postsItems = toUserItems(postsCounts);
  const commentsItems = toUserItems(commentsCounts);
  const likesItems = toUserItems(likesCounts);

  const postsSorted = sortUserItems(postsItems, topN);
  const commentsSorted = sortUserItems(commentsItems, topN);
  const likesSorted = sortUserItems(likesItems, topN);

  await saveUserSnapshot("posts", "weekly", window, postsSorted);
  await saveUserSnapshot("comments", "weekly", window, commentsSorted);
  await saveUserSnapshot("likes", "weekly", window, likesSorted);
}

/**
 * ユーザーランキング（AllTime, 3指標）を構築し保存する。
 * - 投稿数/コメント数/受け取ったいいねの累計（期間フィルタ無し）
 */
export async function buildUserAllTime(windowEnd: number, topN = TOP_N_DEFAULT) {
  const postsCounts = await computeAllTimePostsCounts();
  const commentsCounts = await computeAllTimeCommentsCounts();
  const likesCounts = await computeAllTimeLikesCounts();

  const postsItems = toUserItems(postsCounts);
  const commentsItems = toUserItems(commentsCounts);
  const likesItems = toUserItems(likesCounts);

  const postsSorted = sortUserItems(postsItems, topN);
  const commentsSorted = sortUserItems(commentsItems, topN);
  const likesSorted = sortUserItems(likesItems, topN);

  await saveUserSnapshot("posts", "alltime", { start: null, end: windowEnd }, postsSorted);
  await saveUserSnapshot("comments", "alltime", { start: null, end: windowEnd }, commentsSorted);
  await saveUserSnapshot("likes", "alltime", { start: null, end: windowEnd }, likesSorted);
}
