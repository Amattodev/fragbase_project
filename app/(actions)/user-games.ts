"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createUserGameProfile, deleteUserGameProfile, updateUserGameProfile } from "@/lib/services/server/userGames";
import { getDatabase } from "@/lib/server/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function getUsername(userId: string) {
  const db = getDatabase();
  const row = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!row?.username) throw new Error("username_required");
  return row.username!;
}

export async function createUserGameProfileAction(slug: string, formData: FormData) {
  const userId = await requireSession();
  const patch = extractPatch(formData);
  const { username } = await createUserGameProfile(userId, slug, patch);
  revalidatePath(`/profile/${username}`);
  revalidatePath(`/profile/${username}/games/${slug}`);
  revalidatePath(`/settings/games`);
  revalidatePath(`/settings/games/${slug}/edit`);
  return { redirect: `/profile/${username}/games/${slug}` } as const;
}

export async function updateUserGameProfileAction(slug: string, formData: FormData) {
  const userId = await requireSession();
  await updateUserGameProfile(userId, slug, extractPatch(formData));
  const username = await getUsername(userId);
  revalidatePath(`/profile/${username}`);
  revalidatePath(`/profile/${username}/games/${slug}`);
  revalidatePath(`/settings/games`);
  revalidatePath(`/settings/games/${slug}/edit`);
  return { redirect: `/profile/${username}/games/${slug}` } as const;
}

export async function deleteUserGameProfileAction(slug: string) {
  const userId = await requireSession();
  await deleteUserGameProfile(userId, slug);
  revalidatePath(`/settings/games`);
  const username = await getUsername(userId);
  revalidatePath(`/profile/${username}`);
  return { redirect: `/settings/games` } as const;
}

function extractPatch(formData: FormData) {
  const get = (k: string) => (formData.get(k)?.toString().trim() || "").slice(0, 200);
  const v = (s: string) => (s ? s : null);
  const getAll = (k: string) => formData.getAll(k).map((x) => x.toString()).map((s) => s.trim()).filter(Boolean);
  const mainCharacters = getAll("mainCharacters[]");
  return {
    // legacy passthroughs (not used on new form, kept for compatibility)
    rank: v(get("rank")),
    mainRole: v(get("mainRole")),
    mainCharacter: v(get("mainCharacter")),
    platform: v(get("platform")),
    region: v(get("region")),
    ingameId: v(get("ingameId")),
    notes: (formData.get("notes")?.toString() || "").slice(0, 1000) || null,
    // new fields
    currentRank: v(get('currentRank')),
    highestRank: v(get('highestRank')),
    accountId: v(get('accountId')),
    accountUsername: v(get('accountUsername')),
    mainCharacters: mainCharacters.length ? mainCharacters : null,
  };
}
