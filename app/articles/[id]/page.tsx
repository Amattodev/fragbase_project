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
      const content = youtubeMatch[1];
      
      // チャンネルの場合はカード表示
      if (content.startsWith('channel:')) {
        const channelId = content.replace('channel:', '');
        let channelUrl = '';
        
        if (channelId.startsWith('@')) {
          channelUrl = `https://youtube.com/${channelId}`;
        } else if (channelId.startsWith('UC')) {
          channelUrl = `https://youtube.com/channel/${channelId}`;
        } else {
          channelUrl = `https://youtube.com/c/${channelId}`;
        }
        
        return (
          <div className="my-6">
            <a 
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#2B2B2B] border border-gray-600 rounded-lg p-4 hover:bg-[#3B3B3B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#FF0000">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-sm text-gray-400 mb-1">YouTubeチャンネル</div>
                  <div className="text-[#F5F5F5] font-medium">{channelId}</div>
                </div>
                <div className="flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              </div>
            </a>
          </div>
        );
      }
      
      // 動画埋め込み処理
      let embedUrl = '';
      let height = 315;
      
      if (content.startsWith('video:')) {
        const videoId = content.replace('video:', '');
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (content.startsWith('live:')) {
        const videoId = content.replace('live:', '');
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (content.startsWith('shorts:')) {
        const videoId = content.replace('shorts:', '');
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
        height = 560;
      } else {
        // 後方互換性
        embedUrl = `https://www.youtube.com/embed/${content}`;
      }
      
      return (
        <div className="my-6">
          <iframe
            width="100%"
            height={height}
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg shadow-lg"
          />
        </div>
      );
    }

    const twitchMatch = text.match(/\[twitch:([^\]]+)\]/);
    if (twitchMatch) {
      const content = twitchMatch[1];
      
      // チャンネルの場合はカード表示
      if (content.startsWith('channel:')) {
        const channelName = content.replace('channel:', '');
        const channelUrl = `https://twitch.tv/${channelName}`;
        
        return (
          <div className="my-6">
            <a 
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#2B2B2B] border border-gray-600 rounded-lg p-4 hover:bg-[#3B3B3B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#9146FF">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-sm text-gray-400 mb-1">Twitchチャンネル</div>
                  <div className="text-[#F5F5F5] font-medium">{channelName}</div>
                </div>
                <div className="flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              </div>
            </a>
          </div>
        );
      }
      
      // 動画埋め込み処理
      const parentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      let embedUrl = '';
      
      if (content.startsWith('clip:')) {
        const clipId = content.replace('clip:', '');
        embedUrl = `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parentDomain}`;
      } else if (content.startsWith('video:')) {
        const videoId = content.replace('video:', '');
        embedUrl = `https://player.twitch.tv/?video=${videoId}&parent=${parentDomain}`;
      } else {
        // 後方互換性
        const isClip = !content.match(/^[0-9]+$/);
        embedUrl = isClip
          ? `https://clips.twitch.tv/embed?clip=${content}&parent=${parentDomain}`
          : `https://player.twitch.tv/?video=${content}&parent=${parentDomain}`;
      }

      return (
        <div className="my-6">
          <iframe
            width="100%"
            height="315"
            src={embedUrl}
            frameBorder="0"
            allowFullScreen
            className="rounded-lg shadow-lg"
          />
        </div>
      );
    }

    const tiktokMatch = text.match(/\[tiktok:([^\]]+)\]/);
    if (tiktokMatch) {
      const content = tiktokMatch[1];
      
      // チャンネル（ユーザー）の場合はカード表示
      if (content.startsWith('channel:')) {
        const username = content.replace('channel:', '');
        const channelUrl = `https://tiktok.com/@${username}`;
        
        return (
          <div className="my-6">
            <a 
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#2B2B2B] border border-gray-600 rounded-lg p-4 hover:bg-[#3B3B3B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#000000">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-sm text-gray-400 mb-1">TikTokアカウント</div>
                  <div className="text-[#F5F5F5] font-medium">@{username}</div>
                </div>
                <div className="flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              </div>
            </a>
          </div>
        );
      }
      
      // 動画埋め込み処理
      const videoId = content.startsWith('video:') 
        ? content.replace('video:', '') 
        : content; // 後方互換性
        
      return (
        <div className="my-6">
          <iframe
            width="100%"
            height="600"
            src={`https://www.tiktok.com/embed/${videoId}`}
            frameBorder="0"
            allowFullScreen
            className="rounded-lg shadow-lg"
          />
        </div>
      );
    }

    // Xの投稿とアカウント
    const xMatch = text.match(/\[x:([^\]]+)\]/);
    if (xMatch) {
      const content = xMatch[1];
      
      // アカウントの場合はカード表示
      if (content.startsWith('account:')) {
        const username = content.replace('account:', '');
        const accountUrl = `https://x.com/${username}`;
        
        return (
          <div className="my-6">
            <a 
              href={accountUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#2B2B2B] border border-gray-600 rounded-lg p-4 hover:bg-[#3B3B3B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-sm text-gray-400 mb-1">Xアカウント</div>
                  <div className="text-[#F5F5F5] font-medium">@{username}</div>
                </div>
                <div className="flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              </div>
            </a>
          </div>
        );
      }
      
      // 投稿の場合はカード表示
      if (content.startsWith('post:')) {
        const postId = content.replace('post:', '');
        const postUrl = `https://x.com/i/web/status/${postId}`;
        
        return (
          <div className="my-6">
            <a 
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#2B2B2B] border border-gray-600 rounded-lg p-4 hover:bg-[#3B3B3B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-sm text-gray-400 mb-1">Xの投稿</div>
                  <div className="text-[#F5F5F5] font-medium text-sm">投稿を表示</div>
                </div>
                <div className="flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              </div>
            </a>
          </div>
        );
      }
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

                if (text.match(/\[(youtube|twitch|tiktok|x):[^\]]+\]/)) {
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
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
              title="リンクをコピー"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 
            0-7.07-7.07l-1.72 1.71"
                />
                <path
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 
            7.07l1.71-1.71"
                />
              </svg>
              <span>リンクをコピー</span>
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
