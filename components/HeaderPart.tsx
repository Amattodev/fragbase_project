"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { isPostingEnabled } from "@/lib/featureFlags";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, UserIcon, SettingsIcon, LogOutIcon } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug: useSession 状態を常に観測
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthDebug] useSession status:", status);
      console.log("[AuthDebug] useSession session:", session);
      // API の生値と差がないかも確認
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((json) => console.log("[AuthDebug] /api/auth/session:", json))
        .catch((e) => console.log("[AuthDebug] session fetch error:", e));
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
      const response = await fetch("/api/posts", {
        method: "POST",
      });

      const result = await response.json() as { 
        ok: boolean; 
        post?: { id: string }; 
        error?: string 
      };
      if (result.ok && result.post) {
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
      <nav className="flex items-center space-x-4">
        {/* 認証状態によってUI切り替え */}
        {status === "loading" ? (
          // ローディング中
          <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
        ) : session ? (
          // ログイン状態
          <>
            {/* 投稿ボタン（ログインユーザーのみ表示） */}
            {isPostingEnabled() ? (
              <Button
                className="bg-[#7DB7E8] hover:bg-[#6AA7D8] text-black px-6 py-2 rounded-full"
                onClick={handleCreateArticleClick}
              >
                ＋ 記事を書く
              </Button>
            ) : (
              <Link href="/post">
                <Button className="bg-[#7DB7E8] hover:bg-[#6AA7D8] text-black px-6 py-2 rounded-full">
                  ＋ 投稿
                </Button>
              </Link>
            )}
            
            {/* ユーザーメニュー */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-700"
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
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <UserIcon size={16} />
                  </div>
                )}
                <ChevronDownIcon size={16} />
              </button>
              
              {/* ドロップダウンメニュー */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <UserIcon size={16} className="mr-2" />
                    マイプロフィール
                  </Link>
                  <Link
                    href="/profile/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <SettingsIcon size={16} className="mr-2" />
                    設定
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      signOut();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOutIcon size={16} className="mr-2" />
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
            className="bg-[#7DB7E8] hover:bg-[#6AA7D8] text-black px-6 py-2 rounded-full"
          >
            ログイン
          </Button>
        )}
      </nav>
    </div>
  );
}
