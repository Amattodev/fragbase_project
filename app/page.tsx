"use client";

import ServiceMessage from "@/components/ServiceMessage";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PostGrid from "@/components/PostGrid";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  slug: string;
  createdAt: number;
  updatedAt: number;
  tags: { id: number; name: string; norm: string }[];
  gameCategories: { id: number; name: string; displayName: string }[];
}

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

    const fetchPublishedPosts = async () => {
      try {
        const res = await fetch("/api/posts?status=published&limit=12");
        const data = (await res.json()) as ApiResponse;

        if (data.ok && data.posts) {
          setPosts(data.posts);
        } else {
          setError(data.error || "記事の取得に失敗しました");
        }
      } catch (err) {
        setError("記事の取得中にエラーが発生しました");
        console.error("記事取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5] flex items-center justify-center">
        <div>記事を読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
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
      <main className="max-w-6xl mx-auto p-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400　text-lg mb-4">
              公開記事がありません
            </div>
            <Link href="/post">
              <Button className="bg-[#7DB7E8] text-black hover:bg-[#6AA3D5]">
                最初の記事を書く
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">公開記事</h2>
              <p className="text-gray-400">最新 の投稿をご覧ください</p>
            </div>

            <PostGrid posts={posts} />
          </>
        )}
      </main>
    </>
  );
}
