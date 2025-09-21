import { getUserByUsername, listAuthoredPosts } from "@/lib/services/server/users";
import PostGrid from "@/app/_components/PostGrid";
import { notFound } from "next/navigation";

export default async function UserArticlesPage({ params }: { params: { username: string } }) {
  const user = await getUserByUsername(params.username.toLowerCase());
  if (!user) notFound();
  const posts = await listAuthoredPosts(user.id, 12, 0);
  return (
    <div className="py-4">
      {posts.length === 0 ? <p className="text-sm text-muted-foreground">まだ記事がありません</p> : <PostGrid posts={posts} />}
    </div>
  );
}

