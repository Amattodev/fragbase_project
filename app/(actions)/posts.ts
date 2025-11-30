"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { posts } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

export async function deletePostAction(postId: number, opts?: { username?: string | null }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDatabase();
  const existing = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!existing) {
    throw new Error("not_found");
  }
  if (!existing.userId || existing.userId !== session.user.id) {
    throw new Error("forbidden");
  }

  await db.delete(posts).where(eq(posts.id, postId));

  // 一覧系の画面を再取得
  revalidatePath("/");
  if (opts?.username) {
    revalidatePath(`/profile/${opts.username}`);
  }

  return { ok: true } as const;
}

export async function revalidatePostListsAction(opts?: { username?: string | null }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  revalidatePath("/");
  if (opts?.username) {
    revalidatePath(`/profile/${opts.username}`);
  }

  return { ok: true } as const;
}

