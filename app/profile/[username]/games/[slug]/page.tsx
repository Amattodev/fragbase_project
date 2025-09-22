import { notFound } from "next/navigation";
import { getUserByUsername } from "@/lib/services/server/users";
import { getGameBySlug } from "@/constants/games";
import { getUserGameProfile } from "@/lib/services/server/userGames";

export default async function UserGameProfileViewPage({ params }: { params: { username: string; slug: string } }) {
  const user = await getUserByUsername(params.username.toLowerCase());
  if (!user) notFound();
  const game = getGameBySlug(params.slug);
  if (!game) notFound();
  const profile = await getUserGameProfile(user.id, params.slug);
  if (!profile) notFound();
  return (
    <div className="space-y-2 py-4">
      <h2 className="text-lg font-semibold">{game.nameEn}</h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {profile.rank && <li><Label>Rank</Label><Val>{profile.rank}</Val></li>}
        {profile.mainRole && <li><Label>Main Role</Label><Val>{profile.mainRole}</Val></li>}
        {profile.mainCharacter && <li><Label>Main Character</Label><Val>{profile.mainCharacter}</Val></li>}
        {profile.platform && <li><Label>Platform</Label><Val>{profile.platform}</Val></li>}
        {profile.region && <li><Label>Region</Label><Val>{profile.region}</Val></li>}
        {profile.ingameId && <li><Label>In-game ID</Label><Val>{profile.ingameId}</Val></li>}
      </ul>
      {profile.notes && (
        <div className="mt-2">
          <Label>Notes</Label>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-muted-foreground">{children}</div>;
}
function Val({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}

