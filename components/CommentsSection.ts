// 'use client';

// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { useComments } from "@/features/comments/useComments";
// import { useEffect } from "react";
// import { CommentsSectionProps } from "@/types/comment";

// export default function CommentsSection({ settingId }: CommentsSectionProps) {
//     const {
//         comments,
//         newComment,
//         setNewComment,
//         commentLoading,
//         fetchComments,
//         handlePostComment
//     } = useComments(settingId);

//     useEffect(() => {
//         fetchComments();
//     }, [settingId]);

// // return (
// //     <section className="flex justify-center mt-8">
// //         <div className="w-full max-w-xl space-y-4">
// //             <h2 className="text-xl font-semibold">コメント一覧</h2>

// //             {/* コメントリスト */}
// //             <div className="space-y-2">
// //                 {comments.map((comment) => (
// //                     <div key={comment.id} className="bg-[#2B2B2B] p-4 rounded-lg relative">
// //                         <div className="absolute top-2 right-3 text-xs text-[#666666]">
// //                             {comment.createdAt}
// //                         </div>
// //                         <p className="text-sm">{comment.author}: {comment.content}</p>
// //                     </div>
// //                 ))}
// //             </div>

// //             {/* コメント入力欄 */}
// //             <div className="space-y-2">
// //                 <Textarea
// //                     placeholder="コメントを入力..."
// //                     className="bg-[#2B2B2B]"
// //                     value={newComment}
// //                     onChange={(e) => setNewComment(e.target.value)}
// //                     id="comment-input"
// //                     name="comment"
// //                     disabled={commentLoading}
// //                 />
// //                 <div className="flex justify-end">
// //                     <Button
// //                         className="bg-[#7DB7E8] text-black px-6 py-2 rounded-full"
// //                         onClick={handlePostComment}
// //                         disabled={commentLoading || !newComment.trim()}
// //                     >
// //                         {commentLoading ? "投稿中..." : "投稿する"}
// //                     </Button>
// //                 </div>
// //             </div>
// //         </div>
// //     </section>
// );
// }
