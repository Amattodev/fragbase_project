"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

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

function CommentItem({
  comment,
  postId,
  onUpdate,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  postId: number;
  onUpdate: () => void;
  onReply?: (parentId: number) => void;
  depth?: number;
}) {
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [submittingLike, setSubmittingLike] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const getUserIdentifier = () => {
    let id = localStorage.getItem("userIdentifier");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("userIdentifier", id);
    }
    return id;
  };

  const handleLike = async () => {
    if (submittingLike) return;

    setSubmittingLike(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}/likes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIdentifier: getUserIdentifier() }),
        }
      );

      const data = await res.json();
      if (data.ok) {
        setIsLiked(data.liked);
        setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error("いいねエラー:", error);
    } finally {
      setSubmittingLike(false);
    }
  };

  const loadReplies = async () => {
    if (loadingReplies || replies.length > 0) return;

    setLoadingReplies(true);
    try {
      const userIdentifier = getUserIdentifier();
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}/replies?userIdentifier=${userIdentifier}`
      );
      const data = await res.json();

      if (data.ok) {
        setReplies(data.replies);
      }
    } catch (error) {
      console.error("返信取得エラー:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = async () => {
    if (!showReplies && replies.length === 0) {
      await loadReplies();
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className={`${depth > 0 ? "ml-8 mt-3" : "mb-4"}`}>
      <div className="bg-[#2B2B2B] p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start mb-2">
          <span className="font-medium text-[#7DB7E8]">{comment.author}</span>
          <span className="text-sm text-gray-400">{comment.createdAt}</span>
        </div>
        <p className="text-[#E5E5E5] whitespace-pre-wrap mb-3">
          {comment.content}
        </p>

        {/* アクションボタン */}
        <div className="flex items-center gap-4 text-sm">
          {/* いいねボタン */}
          <button
            onClick={handleLike}
            disabled={submittingLike}
            className={`flex items-center gap-1 transition-colors ${
              isLiked
                ? "text-red-500 hover:text-red-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            <span>{likesCount}</span>
          </button>

          {/* 返信ボタン */}
          {depth < 2 && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-300"
            >
              <MessageCircle size={16} />
              <span>返信</span>
            </button>
          )}

          {/* 返信表示トグル */}
          {comment.repliesCount > 0 && (
            <button
              onClick={toggleReplies}
              className="flex items-center gap-1 text-[#7DB7E8] hover:text-[#6AA3D5]"
            >
              {showReplies ? (
                <>
                  <ChevronUp size={16} />
                  <span>返信を隠す</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  <span>返信を表示({comment.repliesCount})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 返信一覧 */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onUpdate={onUpdate}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
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
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const getUserIdentifier = () => {
    let id = localStorage.getItem("userIdentifier");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("userIdentifier", id);
    }
    return id;
  };

  const handleCommentUpdate = () => {
    fetchComments();
  };

  useEffect(() => {
    fetchComments();
    fetchCommentsCount();
  }, [postId]);

  const fetchComments = async (loadMore = false) => {
    try {
      const currentOffset = loadMore ? offset : 0;
      const userIdentifier = getUserIdentifier();
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
          parentId: replyingTo,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        if (replyingTo) {
          // 返信の場合は全体をリフレッシュ
          fetchComments();
          fetchCommentsCount();
        } else {
          // 新規コメントの場合は先頭に追加
          setComments([data.comment, ...comments]);
          setCommentsCount(commentsCount + 1);
        }
        setContent("");
        setAuthor("");
        setReplyingTo(null);
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

  const handleReply = (parentId: number) => {
    setReplyingTo(parentId);
    document.getElementById("comment-input")?.scrollIntoView({
      behavior: "smooth",
    });
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

      {/* 返信中の表示 */}
      {replyingTo && (
        <div className="mb-3 p-2 bg-[#2B2B2B] rounded border border-[#7DB7E8]">
          <span className="text-sm text-[#7DB7E8]">
            返信中...
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-gray-400 hover:text-gray-300"
            >
              キャンセル
            </button>
          </span>
        </div>
      )}

      {/* コメント投稿フォーム */}
      <form id="comment-form" onSubmit={handleSubmit} className="mb-6">
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
            placeholder={
              replyingTo
                ? "返信を入力してください"
                : "コメントを入力してください"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] 
          min-h-[100px]"
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
              {submitting
                ? "投稿中..."
                : replyingTo
                ? "返信する"
                : "コメントする"}
            </Button>
          </div>
        </div>
      </form>

      {/* コメント一覧 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onUpdate={handleCommentUpdate}
            onReply={handleReply}
          />
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
