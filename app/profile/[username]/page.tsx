import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import PostGrid from "@/app/_components/PostGrid";
import { getUserByUsername, listAuthoredPosts } from "@/lib/services/server/users";

export default async function UserArticlesPage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await getUserByUsername(params.username.toLowerCase());
  if (!user) notFound();

  const session = await auth();
  const isMe = session?.user?.id === user.id;

  const rawView = typeof searchParams?.view === "string" ? searchParams.view : undefined;
  const view = isMe && rawView === "draft" ? "draft" : "published";

  const posts = await listAuthoredPosts(user.id, 12, 0, {
    status: view === "draft" ? "draft" : "published",
  });

  const basePath = `/profile/${user.username}`;
  const publishedHref = basePath;
  const draftHref = `${basePath}?view=draft`;

  return (
    <div className="py-4">
      {isMe && (
        <div className="mb-4 flex items-center justify-end text-xs">
          <div className="inline-flex items-center rounded-full border border-border bg-background/40 p-0.5">
            <Link
              href={publishedHref}
              className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                view === "published" ? "bg-success text-black" : "text-muted-foreground"
              }`}
              aria-current={view === "published" ? "page" : undefined}
            >
              公開
            </Link>
            <Link
              href={draftHref}
              className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                view === "draft" ? "bg-success text-black" : "text-muted-foreground"
              }`}
              aria-current={view === "draft" ? "page" : undefined}
            >
              下書き
            </Link>
          </div>
        </div>
      )}
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだ記事がありません</p>
      ) : (
        <PostGrid
          posts={posts}
          linkMode={view === "draft" ? "editDrafts" : "default"}
          origin="profile"
          profileUsername={user.username}
        />
      )}
    </div>
  );
}
