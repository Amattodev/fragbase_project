export type Comment = {
    id: number;
    settingId: number;
    content: string;
    author: string;
    createdAt: string;
}

//APIレスポンス型
export type CommentsGetResponse = {
    ok: boolean;
    comments?: Comment[];
    error?: string;
}

export type CommentPostResponse = {
    ok: boolean;
    comment?: Comment;
    error?: string;
    errors?: Array<{
        path: string;
        message: string;
    }>;
}

export type CommentsSectionProps = {
    settingId: number;
}
