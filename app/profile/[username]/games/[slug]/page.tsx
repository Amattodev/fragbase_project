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
        {(profile.currentRank || profile.highestRank) && (
          <li>
            <Label>Rank</Label>
            <Val>
              {profile.currentRank ? `Current: ${profile.currentRank}` : null}
              {profile.currentRank && profile.highestRank ? ' / ' : ''}
              {profile.highestRank ? `Peak: ${profile.highestRank}` : null}
            </Val>
          </li>
        )}
        {(profile.accountUsername || profile.accountId) && (
          <li>
            <Label>Account</Label>
            <Val>
              {profile.accountUsername ? `Username: ${profile.accountUsername}` : null}
              {profile.accountUsername && profile.accountId ? ' / ' : ''}
              {profile.accountId ? `ID: ${profile.accountId}` : null}
            </Val>
          </li>
        )}
        {!!(profile.mainCharacters && profile.mainCharacters.length) && (
          <li className="sm:col-span-2">
            <Label>Main Characters</Label>
            <Val>
              {profile.mainCharacters!.join(', ')}
            </Val>
          </li>
        )}
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
