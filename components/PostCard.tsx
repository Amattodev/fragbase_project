"use client";
import Image from "next/image";
import Link from "next/link";

import type { Post } from "@/lib/services/posts";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/articles/${post.id}`}>
      <article className="h-full cursor-pointer rounded-lg bg-[var(--color-surface)] p-6 transition-colors hover:bg-[var(--color-surface-hover)]">
        {/* ゲームカテゴリバッジ */}
        {post.gameCategories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.gameCategories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="rounded-full bg-[var(--color-accent)] px-2 py-1 text-xs font-medium text-black"
              >
                {category.displayName}
              </span>
            ))}
            {post.gameCategories.length > 2 && (
              <span className="rounded-full bg-gray-600 px-2 py-1 text-xs text-white">
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
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-600">
                <span className="text-xs text-gray-300">👤</span>
              </div>
            )}
            <span className="text-sm text-gray-300">{post.user.name || "匿名ユーザー"}</span>
          </div>
        )}

        {/* タイトル */}
        <h3 className="mb-3 line-clamp-2 text-lg font-semibold">{post.title}</h3>

        {/* 抜粋 */}
        <p className="mb-4 line-clamp-3 text-sm text-gray-400">{post.excerpt}</p>

        {/* タグ */}
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
                #{tag.name}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
                +{post.tags.length - 3}個
              </span>
            )}
          </div>
        )}

        {/* 投稿日時 */}
        <div className="mt-auto text-xs text-gray-500">
          {new Date(post.createdAt).toLocaleDateString("ja-JP")}
        </div>
      </article>
    </Link>
  );
}
