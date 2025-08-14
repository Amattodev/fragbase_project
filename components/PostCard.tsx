"use client";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  excerpt: string;
  createdAt: number;
  tags: { id: number; name: string; norm: string }[];
  gameCategories: { id: number; name: string; displayName: string }[];
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/articles/${post.id}`}>
      <article className="bg-[#2B2B2B] rounded-lg p-6 hover:bg-[#3B3B3B] transition-colors cursor-pointer h-full">
        {/* ゲームカテゴリバッジ */}
        {post.gameCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.gameCategories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="bg-[#7DB7E8] text-black px-2 py-1 rounded-full text-xs font-medium"
              >
                {category.displayName}
              </span>
            ))}
            {post.gameCategories.length > 2 && (
              <span className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs">
                +{post.gameCategories.length - 2}個
              </span>
            )}
          </div>
        )}

        {/* タイトル */}
        <h3 className="text-lg font-semibold mb-3 line-clamp-2">
          {post.title}
        </h3>

        {/* 抜粋 */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* タグ */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
              >
                #{tag.name}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                +{post.tags.length - 3}個
              </span>
            )}
          </div>
        )}

        {/* 投稿日時 */}
        <div className="text-xs text-gray-500 mt-auto">
          {new Date(post.createdAt).toLocaleDateString("ja-JP")}
        </div>
      </article>
    </Link>
  );
}
