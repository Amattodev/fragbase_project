"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle } from "lucide-react";

interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  author: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  repliesCount: number;
}

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const getUserIdentifier = () => {
    let id = localStorage.getItem("userIdentifier");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("userIdentifier", id);
    }
    return id;
  };

  useEffect(() => {
    fetchComments();
    fetchCommentsCount();
  }, [postId]);

  const fetchComments = async (loadMore = false) => {
    try {
      const currentOffset = loadMore ? offset : 0;
      const userIdentifier = getUserIdentifier();
      console.log(
        "Fetching comments for postId:",
        postId,
        "with offset:",
        currentOffset,
        "and userIdentifier:",
        userIdentifier
      );
      const res = await fetch(
        `/api/posts/${postId}/comments?limit=20&offset=${currentOffset}&userIdentifier=${userIdentifier}`
      );
      const data = await res.json();

      if (data.ok) {
        if (loadMore) {
          setComments([...comments, ...data.comments]);
        } else {
          setComments(data.comments);
        }
        setHasMore(data.pagination.hasMore);
        setOffset(currentOffset + data.comments.length);
      }
    } catch (error) {
      console.error("コメント取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsCount = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments/count`);
      const data = await res.json();
      if (data.ok) {
        setCommentsCount(data.commentsCount);
      }
    } catch (error) {
      console.error("コメント数取得エラー:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          author: author.trim() || null,
          userIdentifier: getUserIdentifier(),
          parentId: null, // 基本版では返信なし
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setComments([data.comment, ...comments]);
        setCommentsCount(commentsCount + 1);
        setContent("");
        setAuthor("");
      } else {
        alert(data.error || "コメントの投稿に失敗しました");
      }
    } catch (error) {
      console.error("コメント投稿エラー:", error);
      alert("コメントの投稿中にエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="text-center text-gray-400">コメントを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-[#F5F5F5]">
        コメント ({commentsCount})
      </h3>

      {/* コメント投稿フォーム */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="お名前（任意）"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5]"
            maxLength={50}
          />
          <Textarea
            placeholder="コメントを入力してください"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] min-h-[100px]"
            maxLength={500}
            required
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              {content.length}/500文字
            </span>
            <Button
              type="submit"
              disabled={!content.trim() || submitting}
              className="bg-[#7DB7E8] text-black hover:bg-[#6AA3D5]"
            >
              {submitting ? "投稿中..." : "コメントする"}
            </Button>
          </div>
        </div>
      </form>

      {/* コメント一覧 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-[#2B2B2B] p-4 rounded-lg border border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-[#7DB7E8]">
                {comment.author}
              </span>
              <span className="text-sm text-gray-400">{comment.createdAt}</span>
            </div>
            <p className="text-[#E5E5E5] whitespace-pre-wrap mb-3">
              {comment.content}
            </p>

            {/* アクションボタン（いいね数と返信数のみ表示）*/}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Heart size={16} />
                <span>{comment.likesCount}</span>
              </div>
              {comment.repliesCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle size={16} />
                  <span>{comment.repliesCount}件の返信</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="text-center">
            <Button
              onClick={() => fetchComments(true)}
              variant="outline"
              className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
            >
              もっと見る
            </Button>
          </div>
        )}

        {comments.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            まだコメントがありません。最初のコメントを投稿しませんか？
          </p>
        )}
      </div>
    </div>
  );
}
