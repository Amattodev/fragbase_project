import { useState } from 'react';
import { Comment, CommentsGetResponse, CommentPostResponse } from '@/types/comment';

export const useComments = (settingId: number) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    //コメントを取得する
    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/settings/${settingId}/comments`);
            const result: CommentsGetResponse = await res.json();

            if (!res.ok || !result.ok) {
                throw new Error(result.error || "コメントの取得に失敗しました");
            }

            setComments(result.comments || []);
        } catch (error) {
            console.error("コメントの取得エラー", error);
            return [];
        }
    }

    //コメントを投稿する
    const handlePostComment = async () => {
        if (!newComment.trim()) return;

        setCommentLoading(true);

        try {
            const res = await fetch(`/api/settings/${settingId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: newComment,
                    author: "匿名ユーザー",
                }),
            });

            const result: CommentPostResponse = await res.json();

            if (!res.ok || !result.ok) {
                throw new Error(result.error || "コメントの投稿に失敗しました");
            }

            // 成功時は返ってきたコメントを一覧に追加する
            if (result.comment) {
                setComments([result.comment, ...comments]);
            }

            // 入力欄はリセットする
            setNewComment("");
        } catch (error) {
            console.error("コメントの投稿エラー", error);
            return false;
        } finally {
            setCommentLoading(false);
        }
    }

    return {
        comments,
        newComment,
        setNewComment,
        commentLoading,
        fetchComments,
        handlePostComment
    }
}
