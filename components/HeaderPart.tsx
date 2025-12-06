"use client";

import { ChevronDown, Gamepad2, LogOut, Pencil, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getProviders, signIn, signOut, useSession, type ClientSafeProvider } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { LoginModalShell } from "@/components/auth/LoginModalShell";
import { Button } from "@/components/ui/button";
import { isPostingEnabled } from "@/lib/featureFlags";
import { debugFetchSession } from "@/lib/services/auth";
import { createPost } from "@/lib/services/posts";
import DiscordIcon from "@/types/icons/DiscordIcon";
import GoogleIcon from "@/types/icons/GoogleIcon";
import SteamIcon from "@/types/icons/SteamIcon";
import TwitchIcon from "@/types/icons/TwitchIcon";

export default function Header() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug: useSession 状態を常に観測
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthDebug] useSession status:", status);
      console.log("[AuthDebug] useSession session:", session);
      debugFetchSession().then((json) => console.log("[AuthDebug] /api/auth/session:", json));
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

  // Escape でモーダルを閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLoginModal(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  async function openLoginModal() {
    setShowLoginModal(true);
    if (!providers && !providersLoading) {
      setProvidersLoading(true);
      try {
        const res = await getProviders();
        setProviders(res);
      } finally {
        setProvidersLoading(false);
      }
    }
  }

  const handleLogoClick = () => {
    // 完全にページをリロードして確実にリセット
    window.location.href = "/";
  };
  const handleCreateArticleClick = async () => {
    if (!session) {
      openLoginModal();
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
    <div className="flex items-center justify-between">
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
              <Button className="rounded-full px-6" onClick={handleCreateArticleClick}>
                ＋ 記事を書く
              </Button>
            ) : (
              <Link href="/post">
                <Button className="rounded-full px-6">＋ 投稿</Button>
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
                    <Pencil size={16} className="mr-2" />
                    プロフィールを編集
                  </Link>
                  <Link
                    href="/settings/games"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Gamepad2 size={16} className="mr-2" />
                    ゲームプロフィール編集
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
          <Button onClick={openLoginModal} className="rounded-full px-6">
            ログイン
          </Button>
        )}
      </nav>

      {showLoginModal && (
        <LoginModalShell open onClose={() => setShowLoginModal(false)}>
          <LoginModal
            providers={providers}
            loading={providersLoading}
            onSelect={(providerId) => signIn(providerId, { callbackUrl: "/" })}
          />
        </LoginModalShell>
      )}
    </div>
  );
}

function LoginModal({
  providers,
  loading,
  onSelect,
}: {
  providers: Record<string, ClientSafeProvider> | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  const providerIcon = (id: string) => {
    switch (id) {
      case "google":
        return <GoogleIcon className="h-6 w-6" />;
      case "discord":
        return <DiscordIcon className="h-6 w-6" />;
      case "twitch":
        return <TwitchIcon className="h-6 w-6" />;
      case "steam":
        return <SteamIcon className="h-6 w-6 text-[#171A21]" />;
      default:
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-base font-semibold text-foreground">
            ?
          </span>
        );
    }
  };

  const providerLabel = (id: string, name: string) => {
    switch (id) {
      case "google":
        return "Google でログイン";
      case "discord":
        return "Discord でログイン";
      case "twitch":
        return "Twitch でログイン";
      case "steam":
        return "Steam でログイン";
      default:
        return `${name} でログイン`;
    }
  };

  return (
    <div className="space-y-4 px-8 pb-6 pt-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/fragbase_logo.png"
          alt="FragBase"
          width={240}
          height={78}
          className="h-16 w-auto"
        />
        <p className="text-sm text-muted-foreground">
          FRAGBASEヘようこそ！あなたのゲーム体験を共有しましょう。
        </p>
      </div>

      <div className="flex flex-col items-center space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">プロバイダーを読み込み中...</p>
        ) : providers && Object.keys(providers).length > 0 ? (
          Object.values(providers).map((provider) => (
            <Button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              className="group flex w-full max-w-[280px] items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card/90 px-3 py-3 text-base font-medium text-foreground shadow-[0_0_12px_rgba(0,0,0,0.25)] transition duration-150 hover:-translate-y-[1px] hover:border-accent hover:bg-accent/10 hover:shadow-[0_0_18px_rgba(0,245,255,0.35)]"
              variant="outline"
            >
              <span className="text-xl transition-transform group-hover:scale-110">
                {providerIcon(provider.id)}
              </span>
              <span className="text-center">{providerLabel(provider.id, provider.name)}</span>
            </Button>
          ))
        ) : (
          <div className="space-y-2 rounded-lg border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">OAuth 設定が未完了です</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Google Cloud Console 等で OAuth クライアントを作成</li>
              <li>
                リダイレクト URI:{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  http://localhost:3000/api/auth/callback/google
                </code>
              </li>
              <li>.env に Client ID / Secret を設定</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
