"use client";
import { useEffect, useMemo, useState } from "react";
import GameIconRail from "@/components/explore/GameIconRail";
import ArticleGrid from "@/components/explore/ArticleGrid";
import type { RailGame } from "@/components/explore/GameIconRail";
import type { Post } from "@/lib/services/posts";
import { listPosts } from "@/lib/services/posts";

type ExploreClientProps = {
  games: RailGame[];
  initialSelectedSlug: string;
  initialVisibleCount: number;
};

export default function ExploreClient({ games, initialSelectedSlug, initialVisibleCount }: ExploreClientProps) {
  const [selected, setSelected] = useState(initialSelectedSlug);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [page, setPage] = useState({ limit: 24, offset: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // フェッチ（選択/ページングの変更に同期）
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await listPosts({ status: 'published', limit: page.limit, offset: page.offset, gameSlug: selected });
        if (cancelled) return;
        const newPosts = res.posts ?? [];
        setHasMore(Boolean(res.pagination?.hasMore));
        setPosts((prev) => (page.offset === 0 ? newPosts : dedupeById([...prev, ...newPosts])));
      } catch (e) {
        if (!cancelled) {
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [selected, page.limit, page.offset]);

  return (
    <div className="space-y-6">
      <GameIconRail
        games={games}
        selectedSlug={selected}
        visibleCount={visibleCount}
        onSelect={(slug) => {
          setSelected(slug);
          setPage({ limit: 24, offset: 0 });
          setPosts([]);
          setHasMore(true);
        }}
        onShowMore={() => setVisibleCount((c) => c + 20)}
      />

      <ArticleGrid
        posts={posts}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={() => setPage((p) => ({ ...p, offset: p.offset + p.limit }))}
      />
    </div>
  );
}

function dedupeById(list: Post[]) {
  const seen = new Set<number>();
  const out: Post[] = [];
  for (const p of list) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}
