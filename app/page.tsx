import Link from "next/link";

import PostGrid from "@/app/_components/PostGrid";
import ServiceMessage from "@/app/_components/ServiceMessage";
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
      <ServiceMessage />

      <main className="mx-auto max-w-6xl p-4">
        {/* Top Tabs: Trending / Ranking / Explore */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <Link href="/" className="-mb-px border-b-2 border-black px-2 pb-2 text-sm font-medium">
            Trending
          </Link>
          <Link
            href="/rankings"
            className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300"
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
                <Link href="/recent" className="text-sm text-gray-500 hover:underline">
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
                  <div className="rounded-full bg-gray-800 p-1 text-xs">
                    <Link
                      href={"/?rankingPeriod=weekly"}
                      className={`rounded-full px-3 py-1 ${rankingPeriod === "weekly" ? "bg-[var(--color-accent)] text-black" : "text-gray-300"}`}
                    >
                      Weekly
                    </Link>
                    <Link
                      href={"/?rankingPeriod=alltime"}
                      className={`ml-1 rounded-full px-3 py-1 ${rankingPeriod === "alltime" ? "bg-[var(--color-accent)] text-black" : "text-gray-300"}`}
                    >
                      AllTime
                    </Link>
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
