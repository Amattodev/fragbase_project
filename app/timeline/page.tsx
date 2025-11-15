import Link from 'next/link';

import PostGrid from '@/app/_components/PostGrid';
import { TIMELINE_DEFAULT_PAGE_SIZE, TIMELINE_MAX_PAGE_SIZE } from '@/lib/constants/timeline';
import { listTimelinePosts } from '@/lib/services/server/timeline/read';

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

  return (
    <main className="mx-auto max-w-6xl p-4">
      {/* Top Tabs: Trending / Timeline / Ranking / Explore */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <Link href="/" className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300">
          Trending
        </Link>
        <Link href="/timeline" className="-mb-px border-b-2 border-black px-2 pb-2 text-sm font-medium">
          Timeline
        </Link>
        <Link href="/rankings" className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300">
          Ranking
        </Link>
        <Link href="/explore" className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300">
          Explore
        </Link>
      </div>

      <h1 className="mb-3 text-2xl font-semibold">Timeline</h1>

      {posts.length === 0 ? (
        <p className="text-sm text-gray-500">記事が見つかりません</p>
      ) : (
        <PostGrid posts={posts} />
      )}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-500">
          {pagination.offset + 1}–{pagination.offset + posts.length}
        </div>
        <div className="flex gap-2">
          <Link
            href={buildQuery({ offset: String(Math.max(pagination.offset - limit, 0)), limit: String(limit) })}
            className={`rounded border px-3 py-1 ${pagination.offset === 0 ? 'pointer-events-none opacity-40' : ''}`}
          >
            前へ
          </Link>
          <Link
            href={buildQuery({ offset: String(pagination.offset + limit), limit: String(limit) })}
            className={`rounded border px-3 py-1 ${!pagination.hasMore ? 'pointer-events-none opacity-40' : ''}`}
          >
            次へ
          </Link>
        </div>
      </div>
    </main>
  );
}

