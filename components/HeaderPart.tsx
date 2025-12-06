"use client";

import { ChevronDown, Gamepad2, LogOut, Pencil, User, X } from "lucide-react";
import {
  getProviders,
  signIn,
  signOut,
  useSession,
  type ClientSafeProvider,
} from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { isPostingEnabled } from "@/lib/featureFlags";
import { debugFetchSession } from "@/lib/services/auth";
import { createPost } from "@/lib/services/posts";

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
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          providers={providers}
          loading={providersLoading}
          onSelect={(providerId) => signIn(providerId, { callbackUrl: "/" })}
        />
      )}
    </div>
  );
}

function LoginModal({
  onClose,
  providers,
  loading,
  onSelect,
}: {
  onClose: () => void;
  providers: Record<string, ClientSafeProvider> | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  const providerIcon = (id: string) => {
    switch (id) {
      case "google":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-3 0 262 262"
            preserveAspectRatio="xMidYMid"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
            />
            <path
              fill="#34A853"
              d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
            />
            <path
              fill="#FBBC05"
              d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
            />
            <path
              fill="#EB4335"
              d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
            />
          </svg>
        );
      case "discord":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -28.5 256 256"
            fill="none"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <g>
              <path
                d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                fill="#5865F2"
                fillRule="nonzero"
              />
            </g>
          </svg>
        );
      case "twitch":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="none"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path fill="#ffffff" d="M13 7.5l-2 2H9l-1.75 1.75V9.5H5V2h8v5.5z" />
            <g fill="#9146FF">
              <path d="M4.5 1L2 3.5v9h3V15l2.5-2.5h2L14 8V1H4.5zM13 7.5l-2 2H9l-1.75 1.75V9.5H5V2h8v5.5z" />
              <path d="M11.5 3.75h-1v3h1v-3zM8.75 3.75h-1v3h1v-3z" />
            </g>
          </svg>
        );
      case "steam":
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171A21] text-base font-semibold text-white">
            S
          </span>
        );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-[var(--article-card)] shadow-[0_0_40px_rgba(0,245,255,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,245,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,59,254,0.10),transparent_40%)] opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="relative space-y-4 px-8 pb-6 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-border/70 p-2 text-muted-foreground transition hover:border-accent hover:bg-card/60 hover:text-accent"
          >
            <X size={16} />
          </button>

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
      </div>
    </div>
  );
}
