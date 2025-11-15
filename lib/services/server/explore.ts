import 'server-only';

export type RailGame = { slug: string; name: string };

export async function listRailGames(args: { limit: number; order?: string[] }): Promise<RailGame[]> {
  return [];
}

export type ExploreList<T> = { posts: T[]; pagination: { limit: number; offset: number; hasMore: boolean } };

export async function listPostsByGame<T = unknown>(args: {
  slug: string;
  limit: number;
  offset: number;
}): Promise<ExploreList<T>> {
  return { posts: [], pagination: { limit: args.limit, offset: args.offset, hasMore: false } };
}

