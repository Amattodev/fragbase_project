"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import CommentSection from "@/components/CommentsSection";
import { Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Post {
  id: number;
  title: string;
  content: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  tags: { id: number; name: string; norm: string }[];
  gameCategories: { id: number; name: string; displayName: string }[];
}

interface ApiResponse {
  ok: boolean;
  post?: Post;
  error?: string;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [submittingLike, SetSubmittingLike] = useState(false);

  const articleId = params.id as string;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${articleId}`);
        const data = (await res.json()) as ApiResponse;

        if (data.ok && data.post) {
          // 公開記事のみ表示
          if (data.post.status === "published") {
            setPost(data.post);

            // いいね取得
            const likesRes = await fetch(`/api/posts/${articleId}/likes/count`);
            const likesData = await likesRes.json();
            if (likesData.ok) {
              setLikesCount(likesData.likesCount);
            }
          } else {
            setError("この記事は公開されていません");
          }
        } else {
          setError("記事が見つかりません");
        }
      } catch (err) {
        setError("記事の取得中にエラーが発生しました");
        console.error("記事取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchPost();
    }
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5]">
        <div className="flex items-center justify-center pt-20">
          <div>記事を読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5]">
        <div className="max-w-4xl mx-auto p-4 pt-20">
          <div className="text-center">
            <div className="text-red-400 mb-4">{error}</div>
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
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
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
      const res = await fetch(`/api/posts/${post.id}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIdentifier }),
      });

      if (res.ok) {
        setIsLiked(!isLiked);
        setLikesCount((prevCount) => (isLiked ? prevCount - 1 : prevCount + 1));
      }
    } catch (error) {
      console.error("いいねエラー:", error);
    } finally {
      SetSubmittingLike(false);
    }
  };

  //動画埋め込み処理
  const VideoEmbedComponent = ({ text }: { text: string }) => {
    const youtubeMatch = text.match(/\[youtube:([^\]]+)\]/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return (
        <div className="my-6">
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg shadow-lg"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5]">
      <main className="max-w-4xl mx-auto p-4 pt-8">
        {/* 記事ヘッダー */}
        <header className="mb-8">
          {/* ゲームカテゴリ */}
          {post.gameCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.gameCategories.map((category) => (
                <span
                  key={category.id}
                  className="bg-[#7DB7E8] text-black px-3 py-1 rounded-full text-sm font-medium"
                >
                  {category.displayName}
                </span>
              ))}
            </div>
          )}

          {/* タイトル */}
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          {/* メタ情報 */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <div>
              投稿日: {new Date(post.createdAt).toLocaleDateString("ja-JP")}
            </div>
            {post.updatedAt !== post.createdAt && (
              <div>
                更新日: {new Date(post.updatedAt).toLocaleDateString("ja-JP")}
              </div>
            )}
          </div>

          {/* タグ */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* 記事本文 */}
        <article className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // カスタムコンポーネントでスタイリング
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mt-8 mb-4 text-[#F5F5F5] border-b border-gray-600 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-6 mb-3 text-[#F5F5F5]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-medium mt-5 mb-2 text-[#F5F5F5]">
                  {children}
                </h3>
              ),
              p: ({ children }) => {
                const text = React.Children.toArray(children).join("");

                if (text.match(/\[(youtube|vimeo|tiktok):[^\]]+\]/)) {
                  return <VideoEmbedComponent text={text} />;
                }
                return (
                  <p className="mb-4 text-[#E5E5E5] leading-relaxed">
                    {children}
                  </p>
                );
              },
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 text-[#E5E5E5]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 text-[#E5E5E5]">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-[#7DB7E8] pl-4 italic text-[#D0D0D0] my-4">
                  {children}
                </blockquote>
              ),
              code: ({ inline, children }) =>
                inline ? (
                  <code className="bg-[#2B2B2B] text-[#7DB7E8] px-1 py-0.5 rounded text-sm">
                    {children}
                  </code>
                ) : (
                  <code className="block bg-[#2B2B2B] text-[#F5F5F5] p-3 rounded-lg overflow-x-auto">
                    {children}
                  </code>
                ),
              pre: ({ children }) => (
                <pre className="bg-[#2B2B2B] p-4 rounded-lg overflow-x-auto mb-4">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-[#7DB7E8] hover:text-[#6AA3D5] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className="max-w-full h-auto rounded-lg my-4"
                />
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border border-gray-600">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-600 px-4 py-2 bg-[#2B2B2B] text-[#F5F5F5] font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-600 px-4 py-2 text-[#E5E5E5]">
                  {children}
                </td>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center gap-4">
            {/* いいねボタン */}
            <button
              onClick={handleLike}
              disabled={submittingLike}
              className={`flex items-center 
                        gap-2 px-4 py-2 rounded-full transition-colors 
                        ${
                          isLiked
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span>{likesCount}</span>
            </button>
            {/* シェアボタン */}
            <button
              onClick={handleShareOnX}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
              title="Xでシェア"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>シェア</span>
            </button>
          </div>
        </div>

        <CommentSection postId={post.id} />

        {/* フッター */}
        <footer className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex justify-center">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
            >
              記事一覧に戻る
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
