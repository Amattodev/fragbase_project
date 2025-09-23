import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { getDatabase } from '@/lib/server/db';
import { userGameProfiles, users } from '@/db/schema';
import { GAMES, getGameBySlug } from '@/constants/games';
import type { UserGameProfile } from './types';
import { stringifyMainCharacters, mapRowWithParsedMainCharacters } from './mainCharactersCodec';

export function isSupportedGame(slug: string) {
  return !!getGameBySlug(slug);
}

export async function listUserGameProfiles(userId: string) {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(userGameProfiles)
    .where(eq(userGameProfiles.userId, userId))
    .orderBy(desc(userGameProfiles.createdAt));
  // sort by game English name alphabetically for UI
  return rows.map((row) => mapRowWithParsedMainCharacters(row)).sort((a, b) => {
    const ga = GAMES.find((g) => g.slug === a.gameSlug)?.nameEn || a.gameSlug;
    const gb = GAMES.find((g) => g.slug === b.gameSlug)?.nameEn || b.gameSlug;
    return ga.localeCompare(gb);
  });
}

export async function getUserGameProfile(userId: string, slug: string) {
  const db = getDatabase();
  const row = await db
    .select()
    .from(userGameProfiles)
    .where(and(eq(userGameProfiles.userId, userId), eq(userGameProfiles.gameSlug, slug)))
    .get();
  return row ? mapRowWithParsedMainCharacters(row) : undefined;
}

export async function createUserGameProfile(
  userId: string,
  slug: string,
  patch: Partial<Omit<UserGameProfile, 'userId' | 'gameSlug' | 'createdAt' | 'updatedAt'>>,
) {
  if (!isSupportedGame(slug)) throw new Error('unsupported_game');
  const db = getDatabase();
  // Ensure username exists for redirect convenience (reads only)
  const owner = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!owner) throw new Error('user_not_found');
  const existing = await getUserGameProfile(userId, slug);
  if (existing) throw new Error('already_exists');
  const now = Date.now();
  await db.insert(userGameProfiles).values({
    userId,
    gameSlug: slug,
    // legacy
    rank: patch.rank ?? null,
    mainRole: patch.mainRole ?? null,
    mainCharacter: patch.mainCharacter ?? null,
    platform: patch.platform ?? null,
    region: patch.region ?? null,
    ingameId: patch.ingameId ?? null,
    notes: patch.notes ?? null,
    // new
    currentRank: patch.currentRank ?? null,
    highestRank: patch.highestRank ?? null,
    accountId: patch.accountId ?? null,
    accountUsername: patch.accountUsername ?? null,
    mainCharacters: stringifyMainCharacters(patch.mainCharacters),
    createdAt: now,
    updatedAt: now,
  });
  return { username: owner.username!, slug } as const;
}

export async function updateUserGameProfile(
  userId: string,
  slug: string,
  patch: Partial<Omit<UserGameProfile, 'userId' | 'gameSlug' | 'createdAt' | 'updatedAt'>>,
) {
  if (!isSupportedGame(slug)) throw new Error('unsupported_game');
  const db = getDatabase();
  const current = await getUserGameProfile(userId, slug);
  if (!current) throw new Error('not_found');
  await db
    .update(userGameProfiles)
    .set({
      // legacy
      rank: patch.rank ?? null,
      mainRole: patch.mainRole ?? null,
      mainCharacter: patch.mainCharacter ?? null,
      platform: patch.platform ?? null,
      region: patch.region ?? null,
      ingameId: patch.ingameId ?? null,
      notes: patch.notes ?? null,
      // new
      currentRank: patch.currentRank ?? null,
      highestRank: patch.highestRank ?? null,
      accountId: patch.accountId ?? null,
      accountUsername: patch.accountUsername ?? null,
      mainCharacters: stringifyMainCharacters(patch.mainCharacters),
      updatedAt: Date.now(),
    })
    .where(and(eq(userGameProfiles.userId, userId), eq(userGameProfiles.gameSlug, slug)));
}

export async function deleteUserGameProfile(userId: string, slug: string) {
  const db = getDatabase();
  await db
    .delete(userGameProfiles)
    .where(and(eq(userGameProfiles.userId, userId), eq(userGameProfiles.gameSlug, slug)));
}
