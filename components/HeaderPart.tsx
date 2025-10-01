"use client";

import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { isPostingEnabled } from "@/lib/featureFlags";
import { debugFetchSession } from "@/lib/services/auth";
import { createPost } from "@/lib/services/posts";

export default function Header() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug: useSession 状態を常に観測
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthDebug] useSession status:", status);
      console.log("[AuthDebug] useSession session:", session);
      debugFetchSession().then((json) =>
        console.log("[AuthDebug] /api/auth/session:", json),
      );
    }
  }, [status, session]);

  // ドロップダウンの外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleLogoClick = () => {
    // 完全にページをリロードして確実にリセット
    window.location.href = "/";
  };
  const handleCreateArticleClick = async () => {
    if (!session) {
      signIn();
      return;
    }

    try {
      const post = await createPost();
      // 作成成功時は新規記事ページへリダイレクト
      window.location.href = `/articles/${post.id}/edit`;
    } catch (error) {
      console.error("下書き作成エラー:", error);
      alert("記事の作成に失敗しました");
    }
  };
  return (
    <div className="mb-6 flex items-center justify-between">
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
      <nav className="flex items-center space-x-4">
        {/* 認証状態によってUI切り替え */}
        {status === "loading" ? (
          // ローディング中
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300"></div>
        ) : session ? (
          // ログイン状態
          <>
            {/* 投稿ボタン（ログインユーザーのみ表示） */}
            {isPostingEnabled() ? (
              <Button
                className="rounded-full bg-[var(--color-accent)] px-6 py-2 text-black hover:bg-[var(--color-accent-hover)]"
                onClick={handleCreateArticleClick}
              >
                ＋ 記事を書く
              </Button>
            ) : (
              <Link href="/post">
                <Button className="rounded-full bg-[var(--color-accent)] px-6 py-2 text-black hover:bg-[var(--color-accent-hover)]">
                  ＋ 投稿
                </Button>
              </Link>
            )}

            {/* ユーザーメニュー */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 rounded-full p-2 hover:bg-gray-700"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500">
                    <User size={16} />
                  </div>
                )}
                <ChevronDown size={16} />
              </button>

              {/* ドロップダウンメニュー */}
              {showDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border bg-white py-1 shadow-lg">
                  <Link
                    href="/me"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User size={16} className="mr-2" />
                    マイプロフィール
                  </Link>
                  <Link
                    href="/settings/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings size={16} className="mr-2" />
                    設定
                  </Link>
                  <Link
                    href="/settings/games"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings size={16} className="mr-2" />
                    ゲーム設定
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      signOut();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-2" />
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          // 未ログイン状態
          <Button
            onClick={() => signIn()}
            className="rounded-full bg-[var(--color-accent)] px-6 py-2 text-black hover:bg-[var(--color-accent-hover)]"
          >
            ログイン
          </Button>
        )}
      </nav>
    </div>
  );
}
