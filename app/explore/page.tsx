import { GAMES } from "@/constants/games";
import { EXPLORE_RAIL_ORDER, EXPLORE_RAIL_PAGE_SIZE } from "@/constants/gamesOrder";
import Link from "next/link";
import ExploreClient from "./_components/ExploreClient";

export default async function ExplorePage({ searchParams }: { searchParams: { game?: string } }) {
  const orderedGames = orderGames();
  const initialSelected = resolveInitialSelectedSlug(orderedGames, searchParams?.game);

  return (
    <main className="mx-auto max-w-6xl p-4">
      {/* Top Tabs: Trending / Ranking / Explore */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <Link
          href="/"
          className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300"
        >
          Trending
        </Link>
        <Link
          href="/rankings"
          className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300"
        >
          Ranking
        </Link>
        <Link
          href="/explore"
          className="-mb-px border-b-2 border-black px-2 pb-2 text-sm font-medium"
        >
          Explore
        </Link>
      </div>
      <h1 className="mb-3 text-2xl font-semibold">Explore</h1>
      <ExploreClient
        games={orderedGames.map((g) => ({ slug: g.slug, name: g.nameEn }))}
        initialSelectedSlug={initialSelected}
        initialVisibleCount={EXPLORE_RAIL_PAGE_SIZE}
      />
    </main>
  );
}

function orderGames() {
  const base = [...GAMES];
  if (!EXPLORE_RAIL_ORDER || EXPLORE_RAIL_ORDER.length === 0) return base;
  const pos = new Map(EXPLORE_RAIL_ORDER.map((slug, i) => [slug, i] as const));
  return base.sort((a, b) => (pos.get(a.slug) ?? 1e9) - (pos.get(b.slug) ?? 1e9));
}

function resolveInitialSelectedSlug(games: { slug: string; nameEn: string }[], q?: string) {
  const set = new Set(games.map((g) => g.slug));
  return (q && set.has(q) ? q : games[0]?.slug) ?? "";
}
