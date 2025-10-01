import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GAMES } from "@/constants/games";
import { getDatabase } from "@/lib/server/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listUserGameProfiles } from "@/lib/services/server/userGames";
import { GameCard } from "@/components/games/GameCard";

export default async function SettingsGamesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const db = getDatabase();
  const me = await db.select().from(users).where(eq(users.id, session.user.id)).get();
  if (!me?.username) redirect("/settings/profile");

  const added = await listUserGameProfiles(session.user.id);
  const addedSet = new Set(added.map((p) => p.gameSlug));

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Game Settings</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {GAMES.map((g) => (
          <GameCard
            key={g.slug}
            slug={g.slug}
            name={g.nameEn}
            href={addedSet.has(g.slug) ? `/settings/games/${g.slug}/edit` : `/settings/games/${g.slug}/create`}
            added={addedSet.has(g.slug)}
          />
        ))}
      </div>
    </div>
  );
}

