"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";
import { updateProfile } from "@/lib/services/server/users";

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = (formData.get("name") || "").toString();
  const username = (formData.get("username") || "").toString();
  const bio = (formData.get("bio") || "").toString();
  const x = (formData.get("x") || "").toString();
  const youtube = (formData.get("youtube") || "").toString();
  const twitch = (formData.get("twitch") || "").toString();
  const tiktok = (formData.get("tiktok") || "").toString();
  const steam = (formData.get("steam") || "").toString();
  const discord = (formData.get("discord") || "").toString();

  const social: Record<string, string> = {};
  if (x) social.x = x;
  if (youtube) social.youtube = youtube;
  if (twitch) social.twitch = twitch;
  if (tiktok) social.tiktok = tiktok;
  if (steam) social.steam = steam;
  if (discord) social.discord = discord;

  await updateProfile(session.user.id, {
    name: name || undefined,
    username: username || undefined,
    bio: bio || undefined,
    socialLinks: Object.keys(social).length ? social : undefined,
  });

  if (username) revalidatePath(`/profile/${username}`);
  revalidatePath("/me");
  return { ok: true } as const;
}

export async function updateAvatarAction(imageUrl: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const db = getDatabase();
  const currentUser = await db.select().from(users).where(eq(users.id, session.user.id)).get();
  if (!currentUser) throw new Error("User not found");

  const trimmed = typeof imageUrl === "string" ? imageUrl.trim() : "";
  const safeUrl = trimmed && trimmed.length < 2048 ? trimmed : null;

  await db.update(users).set({ image: safeUrl }).where(eq(users.id, session.user.id));

  if (currentUser.username) {
    revalidatePath(`/profile/${currentUser.username}`);
  }
  revalidatePath("/me");
  return { ok: true } as const;
}
