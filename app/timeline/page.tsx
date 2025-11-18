import Link from "next/link";

import PostGrid from "@/app/_components/PostGrid";
import TopNavTabs from "@/app/_components/TopNavTabs";
import { TIMELINE_DEFAULT_PAGE_SIZE, TIMELINE_MAX_PAGE_SIZE } from "@/lib/constants/timeline";
import { listTimelinePosts } from "@/lib/services/server/timeline/read";

export const dynamic = 'force-dynamic';

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sp = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([k, v]) => {
    if (Array.isArray(v)) sp.set(k, v[0] ?? '');
    else if (typeof v === 'string') sp.set(k, v);
  });

  const rawLimit = Number(sp.get('limit'));
  const rawOffset = Number(sp.get('offset'));
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : TIMELINE_DEFAULT_PAGE_SIZE, 1),
    TIMELINE_MAX_PAGE_SIZE,
  );
  const offset = Math.min(Math.max(Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0, 0), 100000);

  const { posts, pagination } = await listTimelinePosts({ limit, offset });

  function buildQuery(patch: Record<string, string>) {
    const q = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => q.set(k, v));
    if (patch.limit) q.set('limit', patch.limit);
    return `?${q.toString()}`;
  }

  const currentPage = Math.floor(pagination.offset / limit) + 1;

  return (
    <>
      <TopNavTabs active="timeline" />
      <main className="mx-auto max-w-6xl p-4">
        <h1 className="mb-3 text-2xl font-semibold">Timeline</h1>

        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">記事が見つかりません</p>
        ) : (
          <PostGrid posts={posts} />
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <Link
            href={buildQuery({
              offset: String(Math.max(pagination.offset - limit, 0)),
              limit: String(limit),
            })}
            className={`inline-flex items-center rounded-full border border-border/70 px-3 py-1.5 transition-colors ${
              pagination.offset === 0
                ? "pointer-events-none opacity-40"
                : "hover:bg-card hover:text-foreground"
            }`}
          >
            前へ
          </Link>
          <span className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-[11px] text-muted-foreground">
            Page {currentPage}
          </span>
          <Link
            href={buildQuery({
              offset: String(pagination.offset + limit),
              limit: String(limit),
            })}
            className={`inline-flex items-center rounded-full border border-border/70 px-3 py-1.5 transition-colors ${
              !pagination.hasMore
                ? "pointer-events-none opacity-40"
                : "hover:bg-card hover:text-foreground"
            }`}
          >
            次へ
          </Link>
        </div>
      </main>
    </>
  );
}
