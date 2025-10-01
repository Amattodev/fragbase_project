import { getUserByUsername, listLikedPosts } from "@/lib/services/server/users";
import PostGrid from "@/app/_components/PostGrid";
import { notFound } from "next/navigation";

export default async function UserLikesPage({ params }: { params: { username: string } }) {
  const user = await getUserByUsername(params.username.toLowerCase());
  if (!user) notFound();
  const posts = await listLikedPosts(user.id, 12, 0);
  return (
    <div className="py-4">
      {posts.length === 0 ? <p className="text-sm text-muted-foreground">まだいいねした記事がありません</p> : <PostGrid posts={posts} />}
    </div>
  );
}

