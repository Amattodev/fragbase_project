import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProfileCounters, getUserByUsername, isFollowing } from "@/lib/services/server/users";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default async function UserLayout({ children, params }: { children: React.ReactNode; params: { username: string } }) {
  const user = await getUserByUsername(params.username.toLowerCase());
  if (!user) notFound();
  const counters = await getProfileCounters(user.id);
  const session = await auth();
  const following = session?.user?.id ? await isFollowing(session.user.id, user.id) : false;
  return (
    <div className="container mx-auto px-4 py-6">
      <ProfileHeader
        viewerId={session?.user?.id}
        user={{ id: user.id, name: user.name, image: user.image, username: user.username, bio: user.bio, socialLinks: user.socialLinks as any }}
        counters={counters}
        isFollowing={following}
      />
      <ProfileTabs username={user.username} />
      <div>{children}</div>
    </div>
  );
}

