"use client";
import { Heart, MoreHorizontal } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import TopNavTabs from "@/app/_components/TopNavTabs";
import { deletePostAction } from "@/app/(actions)/posts";
import { SocialIcons } from "@/components/profile/SocialIcons";
import { Button } from "@/components/ui/button";
import type { Post } from "@/lib/services/posts";
import { markdownComponents } from "@/lib/markdown/components";
import { getPost, getPostLikesCount, togglePostLike } from "@/lib/services/posts";

import CommentSection from "../_components/CommentsSection";

type AuthorProfile = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  socialLinks?: Record<string, string> | null;
  isMe: boolean;
  canFollow: boolean;
  isFollowing: boolean;
};

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [submittingLike, SetSubmittingLike] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [followSubmitting, setFollowSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const from = searchParams.get("from");
  const fromUsername = searchParams.get("username");

  const articleId = params.id as string;

  useEffect(() => {
    const load = async () => {
      try {
        const item = await getPost(articleId);
        if (item.status !== "published") {
          setError("この記事は公開されていません");
          return;
        }
        setPost(item);
        const likes = await getPostLikesCount(articleId);
        setLikesCount(likes);
      } catch (err) {
        console.error("記事取得エラー:", err);
        setError("記事の取得中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    if (articleId) load();
  }, [articleId]);

  // 著者プロフィール取得
  useEffect(() => {
    const loadAuthorProfile = async () => {
      if (!post?.user?.id) return;
      setAuthorLoading(true);
      try {
        const res = await fetch(`/api/users/${post.user.id}/profile`);
        if (!res.ok) {
          console.error("著者プロフィール取得に失敗しました:", await res.text());
          return;
        }
        const data = (await res.json()) as {
          ok: boolean;
          profile?: AuthorProfile;
        };
        if (data.ok && data.profile) {
          setAuthorProfile(data.profile);
        }
      } catch (err) {
        console.error("著者プロフィール取得エラー:", err);
      } finally {
        setAuthorLoading(false);
      }
    };
    loadAuthorProfile();
  }, [post?.user?.id]);

  // 記事操作メニューの外側クリック検知
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopNavTabs active="home" />
        <div className="flex items-center justify-center pt-20">
          <div>記事を読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopNavTabs active="home" />
        <div className="mx-auto max-w-4xl p-4 pt-20">
          <div className="text-center">
            <div className="mb-4 text-red-400">{error}</div>
            <Button onClick={() => router.push("/")}>ホームに戻る</Button>
          </div>
        </div>
      </div>
    );
  }

  //シェア機能
  const handleShareOnX = () => {
    const url = window.location.href;
    const text = `${post?.title}\n\n`;
    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    const text = `${post?.title}\n${url}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("リンクをコピーしました！");
      })
      .catch((err) => {
        console.error("コピーに失敗しました:", err);
        // フォールバック: 手動でコピーできるようにプロンプト表示
        prompt("以下のテキストをコピーしてください:", text);
      });
  };

  const handleEditArticle = () => {
    if (!post) return;
    setMenuOpen(false);
    router.push(`/articles/${post.id}/edit`);
  };

  const handleDeleteArticle = async () => {
    if (!post || deleting) return;
    const ok = window.confirm("この記事を削除しますか？");
    if (!ok) return;
    setDeleting(true);
    try {
      await deletePostAction(post.id, {
        username: from === "profile" ? fromUsername : null,
      });
      setMenuOpen(false);
      if (from === "profile" && fromUsername && authorProfile?.isMe) {
        router.push(`/profile/${fromUsername}`);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      console.error("記事削除エラー:", err);
      alert("記事の削除に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setDeleting(false);
    }
  };

  //いいね機能
  const handleLike = async () => {
    if (!post || submittingLike) return;

    SetSubmittingLike(true);
    try {
      const userIdentifier =
        localStorage.getItem("userIdentifier") ||
        (() => {
          const id = Math.random().toString(36).substring(2, 15);
          localStorage.setItem("userIdentifier", id);
          return id;
        })();
      await togglePostLike(post.id, userIdentifier);
      setIsLiked(!isLiked);
      setLikesCount((prevCount) => (isLiked ? prevCount - 1 : prevCount + 1));
    } catch (error) {
      console.error("いいねエラー:", error);
    } finally {
      SetSubmittingLike(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!authorProfile || !authorProfile.canFollow || followSubmitting) return;
    setFollowSubmitting(true);
    try {
      const res = await fetch(`/api/users/${authorProfile.id}/follow`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        isFollowing?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        console.error("フォローの切り替えに失敗しました:", data.error || res.statusText);
        return;
      }
      setAuthorProfile((prev) =>
        prev ? { ...prev, isFollowing: Boolean(data.isFollowing) } : prev,
      );
    } catch (err) {
      console.error("フォローの切り替えエラー:", err);
    } finally {
      setFollowSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavTabs active="home" />
      {/* 記事ヘッダー（本文・サイドカラムの上） */}
      <header className="mx-auto max-w-6xl px-4 text-center">
        {/* ゲームカテゴリ */}
        {post.gameCategories.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {post.gameCategories.map((category) => (
              <span
                key={category.id}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {category.displayName}
              </span>
            ))}
          </div>
        )}

        {/* タイトル */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight">{post.title}</h1>

        {/* メタ情報 */}
        <div className="mb-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div>投稿日: {new Date(post.createdAt).toLocaleDateString("ja-JP")}</div>
          {post.updatedAt !== post.createdAt && (
            <div>更新日: {new Date(post.updatedAt).toLocaleDateString("ja-JP")}</div>
          )}
        </div>

        {/* タグ */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl p-4 pt-4">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[auto,1fr,260px] md:items-start">
          {/* 左側: main の左に固定されるアクションカラム */}
          <div className="flex w-16 flex-col items-center gap-3 md:sticky md:top-28 md:w-20 md:pt-10">
            {/* いいねボタン */}
            <button
              onClick={handleLike}
              disabled={submittingLike}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                isLiked
                  ? "border-pink-500/70 bg-pink-500/10 text-pink-400"
                  : "border-border bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
              }`}
            >
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
              <span>{likesCount}</span>
            </button>
            {/* シェアボタン */}
            <button
              onClick={handleShareOnX}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              title="Xでシェア"
              aria-label="Xでシェア"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              title="リンクをコピー"
              aria-label="リンクをコピー"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            {/* 記事操作メニュー（著者のみ） */}
            {authorProfile?.isMe && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                  title="記事の操作"
                  aria-label="記事の操作"
                >
                  <MoreHorizontal size={18} />
                </button>
                {menuOpen && (
                  <div className="absolute left-10 top-0 z-30 min-w-[140px] rounded-md border border-border bg-card py-1 text-xs shadow-[0_0_18px_rgba(0,0,0,0.8)]">
                    <button
                      type="button"
                      onClick={handleEditArticle}
                      className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-foreground hover:bg-card/80"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteArticle}
                      disabled={deleting}
                      className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-destructive hover:bg-destructive/10 disabled:opacity-60"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 中央: 記事全体（本文 + コメント） */}
          <div className="flex-1">
            <div className="rounded-xl border border-border bg-[var(--article-card)] px-4 py-6 shadow-sm">
              {/* 記事本文 */}
              <div className="mt-4">
                <article className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {post.content}
                  </ReactMarkdown>
                </article>
              </div>

              <CommentSection postId={post.id} />
            </div>
          </div>

          {/* 右側: 著者プロフィールカラム */}
          {post.user && (
            <aside className="md:sticky md:top-28">
              <div className="rounded-xl border border-border bg-[var(--article-card)] p-4 text-sm shadow-sm">
                <div className="flex flex-col items-center text-center">
                  {authorProfile?.image || post.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(authorProfile?.image || post.user.image) as string}
                      alt={authorProfile?.name || post.user.name || "ユーザー"}
                      className="mb-3 h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-600">
                      <span className="text-lg text-gray-300">👤</span>
                    </div>
                  )}
                  <div className="mb-1 text-base font-semibold">
                    {authorProfile?.name || post.user.name || "匿名ユーザー"}
                  </div>
                  {authorProfile?.username && (
                    <div className="mb-2 text-xs text-muted-foreground">
                      @{authorProfile.username}
                    </div>
                  )}
                  {authorProfile?.bio && (
                    <p className="mb-3 whitespace-pre-wrap text-xs text-[var(--color-subtle-text)]">
                      {authorProfile.bio}
                    </p>
                  )}
                  <SocialIcons links={authorProfile?.socialLinks ?? undefined} />

                  {authorProfile?.canFollow && (
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      disabled={followSubmitting}
                      className={`mt-4 inline-flex h-9 w-full items-center justify-center rounded-full px-3 text-xs font-medium transition-colors ${
                        authorProfile.isFollowing
                          ? "border border-border bg-transparent text-muted-foreground hover:border-primary/60 hover:bg-background/60"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      } disabled:opacity-60`}
                    >
                      {followSubmitting
                        ? "処理中..."
                        : authorProfile.isFollowing
                          ? "フォロー中"
                          : "フォロー"}
                    </button>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
