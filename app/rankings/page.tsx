import Link from "next/link";

import { Heart } from "lucide-react";

import TopNavTabs from "@/app/_components/TopNavTabs";
import { readArticleRankings, readUserRankings } from "@/lib/services/server/rankings/read";
import { rebuildAllSnapshots } from "@/lib/services/server/rankings/rebuild";

type Period = "weekly" | "alltime";
type Metric = "posts" | "comments" | "likes";

type ArticleItem = {
  rank: number;
  likesCount: number;
  post: {
    id: number;
    title: string;
    createdAt: number;
    user: { id: string; username: string | null; name: string | null; image: string | null } | null;
  } | null;
};

type UserItem = {
  rank: number;
  user: { id: string; username: string | null; name: string | null; image: string | null };
  postsCount: number;
  commentsCount: number;
  likesCount: number;
};

function fmtDateYMD(ms?: number | null) {
  if (!ms) return "";
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function buildQuery(base: URLSearchParams, patch: Record<string, string | undefined>) {
  const q = new URLSearchParams(base.toString());
  Object.entries(patch).forEach(([k, v]) => {
    if (v == null) return;
    q.set(k, v);
  });
  // reset paging when switching controls
  if (patch.offset == null) q.delete("offset");
  return `?${q.toString()}`;
}

// サーバコンポーネント内から直接DBを読み、ネットワークに依存しない
async function fetchArticles(period: Period, limit: number, offset: number) {
  const res = await readArticleRankings(period, limit, offset);
  return { ok: res.ok, window: res.window, items: res.items as ArticleItem[] };
}
async function fetchUsers(metric: Metric, period: Period, limit: number, offset: number) {
  const res = await readUserRankings(metric, period, limit, offset);
  return { ok: res.ok, window: res.window, items: res.items as UserItem[] };
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (process.env.NODE_ENV !== "production") {
    await rebuildAllSnapshots();
  }
  const sp = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (Array.isArray(v)) sp.set(k, v[0] ?? "");
    else if (typeof v === "string") sp.set(k, v);
  });

  const articlePeriod = (sp.get("articlePeriod") === "alltime" ? "alltime" : "weekly") as Period;
  const userPeriod = (sp.get("userPeriod") === "alltime" ? "alltime" : "weekly") as Period;
  const metric = (
    sp.get("metric") === "comments" || sp.get("metric") === "likes" ? sp.get("metric") : "posts"
  ) as Metric;
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 20, 1), 50);
  const offset = Math.min(Math.max(Number(sp.get("offset")) || 0, 0), 1000);

  const [articlesRes, usersRes] = await Promise.all([
    fetchArticles(articlePeriod, limit, offset),
    fetchUsers(metric, userPeriod, limit, offset),
  ]);
  const articleItems: ArticleItem[] = Array.isArray((articlesRes as any)?.items)
    ? ((articlesRes as any).items as ArticleItem[])
    : [];
  const userItems: UserItem[] = Array.isArray((usersRes as any)?.items)
    ? ((usersRes as any).items as UserItem[])
    : [];
  const hasApiError = !articlesRes.ok || !usersRes.ok;

  return (
    <>
      <TopNavTabs active="ranking" />
      <main className="mx-auto max-w-6xl p-4">
        {hasApiError && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            ランキングデータの取得に失敗しました。管理画面でスナップショットを作成後、再読み込みしてください。
          </div>
        )}

        {/* Article ranking */}
        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">記事ランキング</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] text-muted-foreground">Period</span>
              <div className="inline-flex items-center rounded-full border border-border bg-background/40 p-0.5">
                {(
                  [
                    { key: "weekly", label: "Weekly" },
                    { key: "alltime", label: "AllTime" },
                  ] as const
                ).map((p) => (
                  <Link
                    key={p.key}
                    href={buildQuery(sp, {
                      articlePeriod: p.key,
                      // articlePeriodを変えたときはオフセットをリセット
                      offset: undefined,
                    })}
                    className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                      articlePeriod === p.key
                        ? "bg-success text-black"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="min-w-full text-center text-sm">
              <tbody>
                {articleItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      記事が見つかりません
                    </td>
                  </tr>
                )}
                {articleItems.map((it) => (
                  <tr key={`a-${it.rank}-${it.post?.id ?? "x"}`} className="border-t">
                    <td className="px-3 py-2">
                      <RankBadge rank={it.rank} />
                    </td>
                    <td className="px-3 py-2 text-left">
                      {it.post ? (
                        <Link href={`/articles/${it.post.id}`} className="hover:underline">
                          {it.post.title}
                        </Link>
                      ) : (
                        <span className="text-gray-400">非公開/削除</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {it.post?.user ? (
                        <Link
                          href={`/profile/${it.post.user.username ?? it.post.user.id}`}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[10px] text-muted-foreground">by</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {it.post.user.image ? (
                            <img
                              src={it.post.user.image}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-200" />
                          )}
                          <span>
                            {it.post.user.name ?? it.post.user.username ?? it.post.user.id}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-center gap-[2px]">
                        <span className="text-[10px] text-muted-foreground">published</span>
                        <span className="text-xs">{fmtDateYMD(it.post?.createdAt ?? null)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3 text-pink-400" />
                        <span className="text-xs text-muted-foreground">{it.likesCount}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* User ranking */}
        <section className="mt-10">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">ユーザーランキング</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] text-muted-foreground">Period</span>
              <div className="inline-flex items-center rounded-full border border-border bg-background/40 p-0.5">
                {(
                  [
                    { key: "weekly", label: "Weekly" },
                    { key: "alltime", label: "AllTime" },
                  ] as const
                ).map((p) => (
                  <Link
                    key={p.key}
                    href={buildQuery(sp, {
                      userPeriod: p.key,
                      // userPeriodを変えたときはオフセットをリセット
                      offset: undefined,
                    })}
                    className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                      userPeriod === p.key
                        ? "bg-success text-black"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="min-w-full text-center text-sm">
              <tbody>
                {userItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      ユーザーが見つかりません
                    </td>
                  </tr>
                )}
                {userItems.map((it) => (
                  <tr key={`u-${it.rank}-${it.user.id}`} className="border-t">
                    <td className="px-3 py-2">
                      <RankBadge rank={it.rank} />
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/profile/${it.user.username ?? it.user.id}`}
                        className="flex items-center gap-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {it.user.image ? (
                          <img
                            src={it.user.image}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-200" />
                        )}
                        <span>{it.user.name ?? it.user.username ?? it.user.id}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {it.postsCount} <span className="text-[10px] opacity-80">articles</span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {it.commentsCount} <span className="text-[10px] opacity-80">comments</span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3 text-pink-400" />
                        <span className="text-xs text-muted-foreground">{it.likesCount}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-[11px] font-semibold text-black shadow-[0_0_12px_rgba(250,204,21,0.7)]">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-[11px] font-semibold text-slate-900 shadow-[0_0_10px_rgba(148,163,184,0.6)]">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[11px] font-semibold text-slate-900 shadow-[0_0_10px_rgba(249,115,22,0.6)]">
        3
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{rank}</span>;
}
