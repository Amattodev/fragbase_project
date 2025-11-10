import Link from "next/link";

import { readArticleRankings, readUserRankings } from "@/lib/services/server/rankings/read";

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

function buildQuery(base: URLSearchParams, patch: Record<string, string>) {
  const q = new URLSearchParams(base.toString());
  Object.entries(patch).forEach(([k, v]) => q.set(k, v));
  // reset paging when switching controls
  if (patch.tab || patch.period || patch.metric) q.delete("offset");
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
  const sp = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (Array.isArray(v)) sp.set(k, v[0] ?? "");
    else if (typeof v === "string") sp.set(k, v);
  });

  const tab = (sp.get("tab") === "users" ? "users" : "articles") as "articles" | "users";
  const period = (sp.get("period") === "alltime" ? "alltime" : "weekly") as Period;
  const metric = (
    sp.get("metric") === "comments" || sp.get("metric") === "likes" ? sp.get("metric") : "posts"
  ) as Metric;
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 20, 1), 50);
  const offset = Math.min(Math.max(Number(sp.get("offset")) || 0, 0), 1000);

  const [articlesRes, usersRes] = await Promise.all([
    fetchArticles(period, limit, offset),
    fetchUsers(metric, period, limit, offset),
  ]);
  const articleItems: ArticleItem[] = Array.isArray((articlesRes as any)?.items)
    ? ((articlesRes as any).items as ArticleItem[])
    : [];
  const articleWindow = (articlesRes as any)?.window ?? null;
  const userItems: UserItem[] = Array.isArray((usersRes as any)?.items)
    ? ((usersRes as any).items as UserItem[])
    : [];
  const userWindow = usersRes.window;
  const hasApiError = !articlesRes.ok || !usersRes.ok;

  const activeWindow = tab === "articles" ? articleWindow : userWindow;
  const windowText = activeWindow
    ? `${fmtDateYMD(activeWindow.start)}–${fmtDateYMD(activeWindow.end)} JST`
    : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Top Tabs: Trending / Ranking / Explore */}
      <div className="mb-4 flex gap-4 border-b border-gray-200">
        <Link
          href="/"
          className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300"
        >
          Trending
        </Link>
        <Link
          href="/rankings"
          className="-mb-px border-b-2 border-black px-2 pb-2 text-sm font-medium"
        >
          Ranking
        </Link>
        <Link
          href="/explore"
          className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300"
        >
          Explore
        </Link>
      </div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">ランキング</h1>
        <div className="text-sm text-gray-500">
          {period === "weekly" ? `前週: ${windowText}` : "AllTime"}
        </div>
      </div>

      {hasApiError && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          ランキングデータの取得に失敗しました。管理画面でスナップショットを作成後、再読み込みしてください。
        </div>
      )}

      {/* Tabs: 記事 / ユーザー */}
      <div className="mt-4 flex gap-4 border-b border-gray-200">
        {(
          [
            { key: "articles", label: "記事" },
            { key: "users", label: "ユーザー" },
          ] as const
        ).map((t) => (
          <Link
            key={t.key}
            href={buildQuery(sp, { tab: t.key })}
            className={`-mb-px border-b-2 px-2 pb-2 text-sm ${tab === t.key ? "border-black font-medium" : "border-transparent text-gray-500"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Controls: Period / Metric */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-sm">
          <span className="text-gray-500">期間:</span>
          {(
            [
              { key: "weekly", label: "Weekly（前週）" },
              { key: "alltime", label: "AllTime" },
            ] as const
          ).map((p) => (
            <Link
              key={p.key}
              href={buildQuery(sp, { period: p.key })}
              className={`rounded px-2 py-1 ${period === p.key ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {tab === "users" && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-500">指標:</span>
            {(
              [
                { key: "posts", label: "投稿" },
                { key: "comments", label: "コメント" },
                { key: "likes", label: "いいね" },
              ] as const
            ).map((m) => (
              <Link
                key={m.key}
                href={buildQuery(sp, { metric: m.key })}
                className={`rounded px-2 py-1 ${metric === m.key ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}
              >
                {m.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded border border-gray-200">
        {tab === "articles" ? (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="w-16 px-3 py-2">#</th>
                <th className="px-3 py-2">タイトル</th>
                <th className="px-3 py-2">ユーザー</th>
                <th className="w-40 px-3 py-2">投稿日</th>
                <th className="w-24 px-3 py-2">いいね</th>
              </tr>
            </thead>
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
                  <td className="px-3 py-2">{it.rank}</td>
                  <td className="px-3 py-2">
                    {it.post ? (
                      <Link
                        href={`/articles/${it.post.id}`}
                        className="text-blue-600 hover:underline"
                      >
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
                        <span>{it.post.user.name ?? it.post.user.username ?? it.post.user.id}</span>
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{fmtDateYMD(it.post?.createdAt ?? null)}</td>
                  <td className="px-3 py-2">{it.likesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="w-16 px-3 py-2">#</th>
                <th className="px-3 py-2">ユーザー</th>
                <th className="w-24 px-3 py-2">投稿</th>
                <th className="w-24 px-3 py-2">コメント</th>
                <th className="w-24 px-3 py-2">いいね</th>
              </tr>
            </thead>
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
                  <td className="px-3 py-2">{it.rank}</td>
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
                  <td className="px-3 py-2">{it.postsCount}</td>
                  <td className="px-3 py-2">{it.commentsCount}</td>
                  <td className="px-3 py-2">{it.likesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (offset based) */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-500">
          {offset + 1}–{offset + (tab === "articles" ? articleItems.length : userItems.length)}
        </div>
        <div className="flex gap-2">
          <Link
            href={buildQuery(sp, { offset: String(Math.max(offset - 20, 0)) })}
            className={`rounded border px-3 py-1 ${offset === 0 ? "pointer-events-none opacity-40" : ""}`}
          >
            前へ
          </Link>
          <Link
            href={buildQuery(sp, { offset: String(offset + 20) })}
            className={`rounded border px-3 py-1 ${(tab === "articles" ? articleItems : userItems).length < 20 ? "pointer-events-none opacity-40" : ""}`}
          >
            次へ
          </Link>
        </div>
      </div>
    </div>
  );
}
