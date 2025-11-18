"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

import type { Post } from "@/lib/services/posts";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/articles/${post.id}`}>
      <article className="h-full cursor-pointer rounded-xl border border-border bg-[var(--article-card)] p-6 shadow-sm transition-[background-color,border-color,box-shadow,transform] hover:border-primary/60 hover:shadow-[0_0_24px_rgba(0,245,255,0.25)] hover:-translate-y-[2px]">
        {/* ゲームカテゴリバッジ */}
        {post.gameCategories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.gameCategories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                {category.displayName}
              </span>
            ))}
            {post.gameCategories.length > 2 && (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary">
                +{post.gameCategories.length - 2}個
              </span>
            )}
          </div>
        )}

        {/* ユーザー情報 */}
        {post.user && (
          <div className="mb-3 flex items-center gap-2">
            {post.user.image ? (
              <Image
                src={post.user.image}
                alt={post.user.name || "ユーザー"}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <span className="text-xs text-muted-foreground">👤</span>
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              {post.user.name || "匿名ユーザー"}
            </span>
          </div>
        )}

        {/* タイトル */}
        <h3 className="mb-3 line-clamp-2 text-lg font-semibold">{post.title}</h3>

        {/* タグ */}
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                #{tag.name}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                +{post.tags.length - 3}個
              </span>
            )}
          </div>
        )}

        {/* 投稿日時 + いいね数 */}
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex flex-col gap-[2px]">
            <span className="text-[10px] text-muted-foreground/80">published</span>
            <span>{new Date(post.createdAt).toLocaleDateString("ja-JP")}</span>
          </span>
          {typeof post.likesCount === "number" && (
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3 w-3 text-pink-400" />
              <span>{post.likesCount}</span>
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
