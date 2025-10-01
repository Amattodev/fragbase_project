"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { toggleFollow } from "@/lib/services/server/users";

export async function toggleFollowAction(ownerId: string, ownerUsername?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const res = await toggleFollow(session.user.id, ownerId);
  if ((res as any).error) throw new Error((res as any).error);
  if (ownerUsername) revalidatePath(`/profile/${ownerUsername}`);
  return res;
}
