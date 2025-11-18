import Link from "next/link";

import PostGrid from "@/app/_components/PostGrid";
import ServiceMessage from "@/app/_components/ServiceMessage";
import TopNavTabs from "@/app/_components/TopNavTabs";
import PostCard from "@/components/PostCard";
import { HOME_DEFAULT_SECTION_LIMIT } from "@/lib/constants/home";
import type { Post } from "@/lib/services/posts";
import { fetchHomeRecentPosts, fetchHomeTrendingPosts } from "@/lib/services/server/home";
import { readArticleRankings } from "@/lib/services/server/rankings/read";

type HomePageProps = { searchParams?: { [key: string]: string | string[] | undefined } };

export default async function HomePage({ searchParams }: HomePageProps) {
  const rankingPeriodParam =
    typeof searchParams?.rankingPeriod === "string" ? searchParams?.rankingPeriod : undefined;
  const rankingPeriod: "weekly" | "alltime" =
    rankingPeriodParam === "alltime" ? "alltime" : "weekly";

  const [trendingPosts, recentPosts] = await Promise.all([
    fetchHomeTrendingPosts({ limit: HOME_DEFAULT_SECTION_LIMIT }),
    fetchHomeRecentPosts({ limit: HOME_DEFAULT_SECTION_LIMIT }),
  ]);

  const ranking = await readArticleRankings(rankingPeriod, 10, 0);
  const rankingPosts: Post[] = ranking.items.map((item) => ({
    id: item.post?.id ?? 0,
    title: item.post?.title ?? "",
    content: "",
    excerpt: "",
    status: "published",
    slug: "",
    createdAt: (item.post?.createdAt as number) ?? Date.now(),
    updatedAt: (item.post?.createdAt as number) ?? Date.now(),
    tags: [],
    gameCategories: [],
    user: item.post?.user
      ? { id: item.post.user.id, name: item.post.user.name, image: item.post.user.image }
      : undefined,
  }));

  const hasAnyContent =
    trendingPosts.length > 0 || recentPosts.length > 0 || rankingPosts.length > 0;

  return (
    <>
      <TopNavTabs active="home" />
      <main className="mx-auto max-w-6xl p-4">
        {/* Service message section */}
        <section className="mb-10">
          <ServiceMessage />
        </section>

      {!hasAnyContent ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg text-gray-400">公開記事がありません</div>
        </div>
      ) : (
        <>
          {/* Trending */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Trending</h2>
              <Link href="/trending" className="text-sm text-gray-500 hover:underline">
                もっと見る
              </Link>
            </div>
            {trendingPosts.length === 0 ? (
              <p className="text-sm text-gray-500">表示できる記事がありません</p>
            ) : (
              <PostGrid posts={trendingPosts} />
            )}
          </section>

          {/* Recent */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent</h2>
              <Link href="/timeline" className="text-sm text-gray-500 hover:underline">
                もっと見る
              </Link>
            </div>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-gray-500">表示できる記事がありません</p>
            ) : (
              <PostGrid posts={recentPosts} />
            )}
          </section>

          {/* Ranking */}
          <section className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ranking</h2>
              <div className="flex items-center gap-3">
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
                        href={`/?rankingPeriod=${p.key}`}
                        className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                          rankingPeriod === p.key
                            ? "bg-success text-black"
                            : "text-muted-foreground"
                        }`}
                      >
                        {p.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  href="/rankings?tab=articles&period=weekly"
                  className="text-sm text-gray-500 hover:underline"
                >
                  もっと見る
                </Link>
              </div>
            </div>
            {rankingPosts.length === 0 ? (
              <p className="text-sm text-gray-500">表示できる記事がありません</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {rankingPosts.map((post) => (
                  <div key={post.id} className="min-w-[280px] max-w-[360px] flex-1">
                    {/* 既存カードをそのまま再利用 */}
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      </main>
    </>
  );
}
