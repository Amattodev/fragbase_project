"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import PostGrid from "@/app/_components/PostGrid";
import ServiceMessage from "@/app/_components/ServiceMessage";
import { Button } from "@/components/ui/button";
import { DEFAULT_POSTS_PAGE_SIZE } from "@/constants/pagination";
import { getPublishedPosts } from "@/lib/services/posts";
import type { Post } from "@/lib/services/posts";

interface ApiResponse {
  ok: boolean;
  posts?: Post[];
  error?: string;
}

export default function HomePage() {
  // const searchParams = useSearchParams();
  // const searchHook = useSettingSearch();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    //urlクエリパラメータから検索条件を復元
    {
      /* memo０８１４：UIUXの改修に伴ってコメントアウト中 */
    }
    // const filters = {
    //   game: searchParams.get("game") || undefined,
    //   role: searchParams.get("role") || undefined,
    //   character: searchParams.get("character") || undefined,
    //   fpsExperience: searchParams.get("fpsExperience") || undefined,
    // };

    // 検索条件がある場合は条件付き検索、なければ全件取得
    //   const hasFilters = Object.values(filters).some((value) => value);
    //   if (hasFilters) {
    //     searchHook.setFilters(filters);
    //     searchHook.searchSettings(filters);
    //   } else {
    //     searchHook.searchSettings();
    //   }
    // }, [searchParams]);

    const load = async () => {
      try {
        const items = await getPublishedPosts(DEFAULT_POSTS_PAGE_SIZE);
        setPosts(items);
      } catch (err) {
        console.error("記事取得エラー:", err);
        setError("記事の取得中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div>記事を読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="text-center">
          <div className="mb-4 text-red-400">{error}</div>
          <Button onClick={() => window.location.reload()}>再読み込み</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* サービスメッセージ */}
      <ServiceMessage />

      {/* memo０８１４：UIUXの改修に伴ってコメントアウト中 */}
      {/* フィルター検索エリア */}
      {/* <FilterArea searchHook={searchHook} /> */}

      {/* 新着設定一覧 */}
      {/* <SettingCard searchHook={searchHook} /> */}
      <main className="mx-auto max-w-6xl p-4">
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-gray-400 text-lg mb-4">公開記事がありません</div>
            <Link href="/post">
              <Button className="bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]">
                最初の記事を書く
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="mb-2 text-xl font-semibold">公開記事</h2>
              <p className="text-gray-400">最新 の投稿をご覧ください</p>
            </div>

            <PostGrid posts={posts} />
          </>
        )}
      </main>
    </>
  );
}
