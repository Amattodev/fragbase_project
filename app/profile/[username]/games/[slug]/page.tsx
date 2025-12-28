import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserByUsername } from "@/lib/services/server/users";
import { getGameBySlug } from "@/constants/games";
import { getUserGameProfile, listPlayersByGame } from "@/lib/services/server/userGames";
import { Button } from "@/components/ui/button";
import { GameRankCard } from "@/components/games/GameRankCard";
import { GameAccountCard } from "@/components/games/GameAccountCard";
import { GameMainCharactersCard } from "@/components/games/GameMainCharactersCard";
import { GamePlayersStrip } from "@/components/games/GamePlayersStrip";
import { GameNotesCard } from "@/components/games/GameNotesCard";

export default async function UserGameProfileViewPage({ params }: { params: { username: string; slug: string } }) {
  const user = await getUserByUsername(params.username.toLowerCase());
  if (!user) notFound();
  const game = getGameBySlug(params.slug);
  if (!game) notFound();
  const profile = await getUserGameProfile(user.id, params.slug);
  if (!profile) notFound();
  const session = await auth();
  const isOwner = session?.user?.id === user.id;
  const players = await listPlayersByGame(game.slug, { excludeUserId: user.id, limit: 48 });

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{game.nameEn}</h2>
        {isOwner ? (
          <Link href={`/settings/games/${game.slug}/edit`}>
            <Button size="sm">編集</Button>
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4">
          <GameRankCard slug={game.slug} currentRank={profile.currentRank} highestRank={profile.highestRank} />
          <GameAccountCard accountUsername={profile.accountUsername} accountId={profile.accountId} />
          <GameNotesCard notes={profile.notes} />
        </div>
        <div className="lg:col-span-7 space-y-4">
          <GameMainCharactersCard slug={game.slug} mainCharacters={profile.mainCharacters ?? undefined} />
        </div>
      </div>
      <GamePlayersStrip slug={game.slug} players={players} />
      {(!profile.currentRank && !profile.highestRank && !profile.accountId && !profile.accountUsername && !(profile.mainCharacters && profile.mainCharacters.length) && !(profile.notes && profile.notes.trim().length)) && (
        <p className="text-sm text-muted-foreground">まだ情報が登録されていません。編集から追加しましょう。</p>
      )}
    </div>
  );
}
