"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { isPostingEnabled } from "@/lib/featureFlags";

export default function Header() {
  const handleLogoClick = () => {
    // 完全にページをリロードして確実にリセット
    window.location.href = "/";
  };
  const handleCreateArticleClick = async () => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
      });

      const result = await response.json();
      if (result.ok) {
        // 作成成功時は新規記事ページへリダイレクト
        window.location.href = `/articles/${result.post.id}/edit`;
      } else {
        console.error("下書き作成エラー:", result.error);
        alert("記事の作成に失敗しました");
      }
    } catch (error) {
      console.error("下書き作成エラー:", error);
      alert("記事の作成に失敗しました");
    }
  };
  return (
    <div className="flex justify-between items-center mb-6">
      <Link href="/" onClick={handleLogoClick}>
        <Image
          src="/fragbase_logo.png"
          alt="FragBase"
          width={210}
          height={70}
          className="object-contain"
          priority
        />
      </Link>
      <nav className="flex space-x-4">
        {/* 機能フラグで投稿ボタンの動作を制御 */}
        {isPostingEnabled() ? (
          // 記事投稿機能が有効な場合：記事エディタに遷移
          <Button
            className="bg-[#7DB7E8] hover:bg-[#6AA7D8] text-black px-6 py-2 rounded-full"
            onClick={handleCreateArticleClick}
          >
            ＋ 記事を書く
          </Button>
        ) : (
          // 記事投稿機能が無効な場合：従来の投稿ページ
          <Link href="/post">
            <Button className="bg-[#7DB7E8] hover:bg-[#6AA7D8] text-black px-6 py-2 rounded-full">
              ＋ 投稿
            </Button>
          </Link>
        )}
      </nav>
    </div>
  );
}
