import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProfileCounters, getUserByUsername, isFollowing } from "@/lib/services/server/users";
import { listUserGameProfiles } from "@/lib/services/server/userGames";
import { GAMES } from "@/constants/games";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default async function UserLayout({ children, params }: { children: React.ReactNode; params: { username: string } }) {
  const user = await getUserByUsername(params.username.toLowerCase());
  if (!user) notFound();
  const counters = await getProfileCounters(user.id);
  const session = await auth();
  const following = session?.user?.id ? await isFollowing(session.user.id, user.id) : false;
  const gameProfiles = await listUserGameProfiles(user.id);
  const tabs = gameProfiles.map((p) => {
    const g = GAMES.find((x) => x.slug === p.gameSlug);
    return g ? { slug: g.slug, nameEn: g.nameEn } : undefined;
  }).filter(Boolean) as { slug: string; nameEn: string }[];

  return (
    <div className="container mx-auto px-4 py-6">
      <ProfileHeader
        viewerId={session?.user?.id}
        user={{ id: user.id, name: user.name, image: user.image ?? "", username: user.username!, bio: user.bio, socialLinks: user.socialLinks as any }}
        counters={counters}
        isFollowing={following}
      />
      <ProfileTabs username={user.username!} gameTabs={tabs} />
      <div>{children}</div>
    </div>
  );
}
