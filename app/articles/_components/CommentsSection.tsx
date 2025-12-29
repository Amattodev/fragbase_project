"use client";
import { ChevronDown, ChevronUp, Heart, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_COMMENT_LENGTH } from "@/constants";
import type { Comment } from "@/lib/services/comments";
import {
  getComments,
  getCommentsCount,
  createComment,
  getReplies,
  toggleCommentLike,
} from "@/lib/services/comments";

function CommentItem({
  comment,
  postId,
  onUpdate,
  onReply,
  depth = 0,
  isLoggedIn = false,
}: {
  comment: Comment;
  postId: number;
  onUpdate: () => void;
  onReply?: (parentId: number) => void;
  depth?: number;
  isLoggedIn?: boolean;
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
      const liked = await toggleCommentLike(postId, comment.id, getUserIdentifier());
      setIsLiked(liked);
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
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
      const data = await getReplies(postId, comment.id, userIdentifier);
      setReplies(data);
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
      <div className="rounded-lg border border-gray-700 bg-[var(--color-surface)] p-4">
        <div className="mb-2 flex items-start gap-3">
          {/* ユーザーアイコン */}
          {comment.user?.image ? (
            <img
              src={comment.user.image}
              alt={comment.user.name || comment.author}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600">
              <span className="text-sm text-gray-300">👤</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              {comment.user?.username ? (
                <Link
                  href={`/profile/${comment.user.username}`}
                  className="font-medium text-[var(--color-accent)] hover:underline"
                >
                  {comment.user.name || comment.user.username}
                </Link>
              ) : (
                <span className="font-medium text-[var(--color-accent)]">{comment.author}</span>
              )}
              <span className="text-sm text-gray-400">{comment.createdAt}</span>
            </div>
          </div>
        </div>
        <p className="mb-3 whitespace-pre-wrap text-[var(--color-subtle-text)] pl-11">{comment.content}</p>

        {/* アクションボタン */}
        <div className="flex items-center gap-4 text-sm pl-11">
          {/* いいねボタン */}
          <button
            onClick={handleLike}
            disabled={submittingLike}
            className={`flex items-center gap-1 transition-colors ${
              isLiked ? "text-red-500 hover:text-red-400" : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            <span>{likesCount}</span>
          </button>

          {/* 返信ボタン（ログイン時のみ） */}
          {depth === 0 && isLoggedIn && (
            <button
              onClick={() => onReply?.(comment.id)}
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
              className="flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
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
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId }: { postId: number }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const isLoggedIn = !!session?.user;

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
    const initialize = async () => {
      await fetchComments();
      await fetchCommentsCountFn();
    };
    initialize();
  }, [postId]);

  const fetchComments = async (loadMore = false) => {
    try {
      const currentOffset = loadMore ? offset : 0;
      const userIdentifier = getUserIdentifier();
      const { comments: items, hasMore } = await getComments(postId, {
        limit: 20,
        offset: currentOffset,
        userIdentifier,
      });
      if (loadMore) {
        setComments([...comments, ...items]);
      } else {
        setComments(items);
      }
      setHasMore(hasMore);
      setOffset(currentOffset + items.length);
    } catch (error) {
      console.error("コメント取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsCountFn = async () => {
    try {
      const count = await getCommentsCount(postId);
      setCommentsCount(count);
    } catch (error) {
      console.error("コメント数取得エラー:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting || !isLoggedIn) return;

    setSubmitting(true);
    try {
      const created = await createComment(postId, {
        content: content.trim(),
        parentId: replyingTo ?? undefined,
      });
      if (created) {
        if (replyingTo) {
          // 返信の場合は全体をリフレッシュ
          fetchComments();
          fetchCommentsCountFn();
        } else {
          // 新規コメントの場合は先頭に追加
          setComments([created, ...comments]);
          setCommentsCount(commentsCount + 1);
        }
        setContent("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("コメント投稿エラー:", error);
      alert("コメントの投稿に失敗しました。ログインしてから再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: number) => {
    if (!isLoggedIn) return;
    setReplyingTo(parentId);
    document.getElementById("comment-input")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="mt-8 border-t border-gray-700 pt-6">
        <div className="text-center text-gray-400">コメントを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-700 pt-6">
      <h3 className="mb-4 text-xl font-semibold text-[var(--color-text)]">コメント ({commentsCount})</h3>

      {/* コメント投稿フォーム（ログイン時のみ） */}
      {isLoggedIn ? (
        <>
          {/* 返信中の表示 */}
          {replyingTo && (
            <div className="mb-3 rounded border border-[var(--color-accent)] bg-[var(--color-surface)] p-2">
              <span className="text-sm text-[var(--color-accent)]">
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

          <form id="comment-form" onSubmit={handleSubmit} className="mb-6">
            <div className="flex items-start gap-3">
              {/* ログインユーザーのアイコン */}
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "ユーザー"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600">
                  <span className="text-sm text-gray-300">👤</span>
                </div>
              )}
              <div className="flex-1 space-y-3">
                <Textarea
                  id="comment-input"
                  placeholder={replyingTo ? "返信を入力してください" : "コメントを入力してください"}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] border-gray-600 bg-[var(--color-surface)] text-[var(--color-text)]"
                  maxLength={MAX_COMMENT_LENGTH}
                  required
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{content.length}/{MAX_COMMENT_LENGTH}文字</span>
                  <Button
                    type="submit"
                    disabled={!content.trim() || submitting}
                    className="bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]"
                  >
                    {submitting ? "投稿中..." : replyingTo ? "返信する" : "コメントする"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </>
      ) : (
        <div className="mb-6 rounded-lg border border-gray-700 bg-[var(--color-surface)] p-4 text-center">
          <p className="text-sm text-gray-400">
            コメントするには<Link href="/api/auth/signin" className="text-[var(--color-accent)] hover:underline">ログイン</Link>してください
          </p>
        </div>
      )}

      {/* コメント一覧 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onUpdate={handleCommentUpdate}
            onReply={handleReply}
            isLoggedIn={isLoggedIn}
          />
        ))}

        {hasMore && (
          <div className="text-center">
            <Button
              onClick={() => fetchComments(true)}
              variant="outline"
              className="border-gray-600 bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            >
              もっと見る
            </Button>
          </div>
        )}

        {comments.length === 0 && (
          <p className="py-8 text-center text-gray-400">
            まだコメントがありません。最初のコメントを投稿しませんか？
          </p>
        )}
      </div>
    </div>
  );
}
