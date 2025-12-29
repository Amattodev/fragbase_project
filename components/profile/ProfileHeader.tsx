import { Pencil } from "lucide-react";
import Link from "next/link";
import { SocialIcons } from "@/components/profile/SocialIcons";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/app/(actions)/follow";

type Counters = { followerCount: number; totalPostLikes: number; publishedCount: number };

export function ProfileHeader({
  viewerId,
  user,
  counters,
  isFollowing,
}: {
  viewerId?: string | null;
  user: { id: string; name: string | null; image: string | null; username: string; bio: string | null; socialLinks?: Record<string, string> | null };
  counters: Counters;
  isFollowing: boolean;
}) {
  const isMe = viewerId === user.id;
  return (
    <header className="pb-6">
      <div className="flex items-start gap-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name ?? user.username} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-300" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{user.name || user.username}</h1>
            <span className="text-muted-foreground">@{user.username}</span>
          </div>
          {user.bio && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{user.bio}</p>}
          <SocialIcons links={user.socialLinks ?? undefined} />
          <div className="mt-3 flex gap-6 text-sm">
            <div><span className="font-semibold">{counters.totalPostLikes}</span> Likes</div>
            <div><span className="font-semibold">{counters.publishedCount}</span> Articles</div>
            <div><span className="font-semibold">{counters.followerCount}</span> Followers</div>
          </div>
        </div>
        <div>
          {isMe ? (
            <Link href="/settings/profile">
              <Button variant="secondary" className="rounded-full px-6">
                <Pencil size={16} className="mr-2" />
                プロフィールを編集
              </Button>
            </Link>
          ) : viewerId ? (
            <form action={async () => { 'use server'; await toggleFollowAction(user.id, user.username); }}>
              <Button type="submit" variant={isFollowing ? "secondary" : "default"}>
                {isFollowing ? "フォロー中" : "フォロー"}
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}

