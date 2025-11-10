"use client";
import type { Post } from "@/lib/services/posts";
import PostCard from "@/components/PostCard";

export type ArticleGridProps = {
  posts: Post[];
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
};

export default function ArticleGrid({ posts, hasMore, loading, onLoadMore }: ArticleGridProps) {
  return (
    <section aria-label="記事一覧" className="space-y-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && posts.length === 0 ? (
          <GridSkeleton />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
      <div className="flex items-center justify-center">
        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-md border px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)]"
            aria-label="さらに記事を読み込む"
          >
            もっと見る
          </button>
        ) : (
          posts.length > 0 && (
            <span className="text-xs text-muted-foreground">すべて表示しました</span>
          )
        )}
      </div>
    </section>
  );
}

function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-700/30" />
      ))}
    </>
  );
}

