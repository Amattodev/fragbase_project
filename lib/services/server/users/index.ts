import { and, desc, eq, inArray } from "drizzle-orm";
import {
  follows,
  gameCategories,
  postGameCategories,
  postLikes,
  postTags,
  posts,
  tags,
  userProfiles,
  users,
} from "@/db/schema";
import { getDatabase } from "@/lib/server/db";
import type { Post } from "@/lib/services/posts/types";

export type SocialLinks = Record<string, string>;

export function normalizeUsername(input: string): string {
  // 全角→半角など互換正規化し、小文字化
  return input.trim().normalize("NFKC").toLowerCase();
}

const RESERVED = new Set([
  "me",
  "settings",
  "admin",
  "api",
  "u",
  "auth",
  "images",
  "videos",
]);

export function isValidUsername(username: string): boolean {
  // 英数字 + - _ のみ、先頭/末尾は英数字、3–20 文字
  const re = /^[a-z0-9](?:[a-z0-9_-]{1,18}[a-z0-9])$/;
  return re.test(username) && !RESERVED.has(username);
}

export async function getUserByUsername(username: string) {
  const db = getDatabase();
  const u = await db.select().from(users).where(eq(users.username, username)).get();
  if (!u) return null;
  const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, u.id)).get();
  let social: SocialLinks | undefined;
  try {
    social = profile?.socialLinks ? (JSON.parse(profile.socialLinks) as SocialLinks) : undefined;
  } catch {
    social = undefined;
  }
  return {
    id: u.id,
    name: u.name ?? null,
    image: u.image ?? null,
    username: u.username!,
    bio: profile?.bio ?? null,
    socialLinks: social,
  } as const;
}

export async function getProfileCounters(userId: string) {
  const db = getDatabase();
  const followerCount = (
    await db.select().from(follows).where(eq(follows.followingId, userId))
  ).length;

  const publishedCount = (
    await db.select().from(posts).where(and(eq(posts.userId, userId), eq(posts.status, "published")))
  ).length;

  const totalPostLikes = (
    await db
      .select()
      .from(postLikes)
      .leftJoin(posts, eq(posts.id, postLikes.postId))
      .where(and(eq(posts.userId, userId), eq(posts.status, "published")))
  ).length;

  return { followerCount, publishedCount, totalPostLikes } as const;
}

async function hydratePosts(base: { id: number; title: string; content: string; contentHtml: string; slug: string; status: string; createdAt: number; updatedAt: number; userId: string | null; }[]): Promise<Post[]> {
  const db = getDatabase();
  const ids = base.map((p) => p.id);
  if (ids.length === 0) return [];

  // Tag relations and details (2-step to avoid select({...}) typing)
  const tagRels = await db
    .select()
    .from(postTags)
    .where(inArray(postTags.postId, ids));
  const tagIds = Array.from(new Set(tagRels.map((r) => r.tagId))).filter((v): v is number => v != null);
  const tagRows = tagIds.length ? await db.select().from(tags).where(inArray(tags.id, tagIds)) : [];
  const tagById = new Map<number, { id: number; name: string; norm: string }>();
  for (const t of tagRows) tagById.set(t.id!, { id: t.id!, name: t.name!, norm: t.norm! });
  const tagMap = new Map<number, { id: number; name: string; norm: string }[]>();
  for (const rel of tagRels) {
    const arr = tagMap.get(rel.postId) ?? [];
    const t = rel.tagId != null ? tagById.get(rel.tagId) : undefined;
    if (t) arr.push(t);
    tagMap.set(rel.postId, arr);
  }

  // Game category relations and details (2-step)
  const catRels = await db
    .select()
    .from(postGameCategories)
    .where(inArray(postGameCategories.postId, ids));
  const catIds = Array.from(new Set(catRels.map((r) => r.gameCategoryId))).filter((v): v is number => v != null);
  const catRows = catIds.length
    ? await db.select().from(gameCategories).where(inArray(gameCategories.id, catIds))
    : [];
  const catById = new Map<number, { id: number; name: string; displayName: string }>();
  for (const c of catRows) catById.set(c.id!, { id: c.id!, name: c.name!, displayName: c.displayName! });
  const catMap = new Map<number, { id: number; name: string; displayName: string }[]>();
  for (const rel of catRels) {
    const arr = catMap.get(rel.postId) ?? [];
    const c = rel.gameCategoryId != null ? catById.get(rel.gameCategoryId) : undefined;
    if (c) arr.push(c);
    catMap.set(rel.postId, arr);
  }

  return base.map<Post>((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    excerpt: p.contentHtml?.slice(0, 120) ?? "",
    status: p.status,
    slug: p.slug,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    tags: tagMap.get(p.id) ?? [],
    gameCategories: catMap.get(p.id) ?? [],
    user: undefined,
  }));
}

export async function listAuthoredPosts(userId: string, limit = 12, offset = 0): Promise<Post[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.status, "published")))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
  return hydratePosts(rows as any);
}

export async function listLikedPosts(targetUserId: string, limit = 12, offset = 0): Promise<Post[]> {
  const db = getDatabase();
  const liked = await db
    .select()
    .from(postLikes)
    .where(eq(postLikes.userIdentifier, targetUserId))
    .limit(500);
  const postIds = liked.map((l) => l.postId).filter((v): v is number => v != null);
  if (postIds.length === 0) return [];
  const rows = await db
    .select()
    .from(posts)
    .where(and(inArray(posts.id, postIds), eq(posts.status, "published")))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
  return hydratePosts(rows as any);
}

export async function isFollowing(viewerId: string, ownerId: string): Promise<boolean> {
  if (!viewerId || !ownerId || viewerId === ownerId) return false;
  const db = getDatabase();
  const row = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, ownerId)))
    .get();
  return !!row;
}

export async function toggleFollow(viewerId: string, ownerId: string): Promise<{ following: boolean } | { error: string }> {
  if (!viewerId) return { error: "unauthorized" } as const;
  if (viewerId === ownerId) return { error: "cannot_follow_self" } as const;
  const db = getDatabase();
  const exists = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, ownerId)))
    .get();
  if (exists) {
    await db.delete(follows).where(and(eq(follows.followerId, viewerId), eq(follows.followingId, ownerId)));
    return { following: false } as const;
  }
  await db.insert(follows).values({ followerId: viewerId, followingId: ownerId });
  return { following: true } as const;
}

export async function updateProfile(
  userId: string,
  patch: { name?: string | null; username?: string; bio?: string | null; socialLinks?: SocialLinks | null },
) {
  const db = getDatabase();
  // 表示名
  if (patch.name !== undefined) {
    const raw = patch.name ?? null;
    const name = raw ? raw.trim().normalize("NFKC").slice(0, 50) : null;
    await db.update(users).set({ name }).where(eq(users.id, userId));
  }
  if (patch.username) {
    const username = normalizeUsername(patch.username);
    if (!isValidUsername(username)) throw new Error("invalid_username");
    // 重複チェック
    const existing = await db.select().from(users).where(eq(users.username, username)).get();
    if (existing && existing.id !== userId) throw new Error("username_taken");
    await db.update(users).set({ username }).where(eq(users.id, userId));
  }

  if (patch.bio !== undefined || patch.socialLinks !== undefined) {
    const current = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).get();
    const social =
      patch.socialLinks === undefined
        ? current?.socialLinks ?? null
        : patch.socialLinks
        ? JSON.stringify(patch.socialLinks)
        : null;
    const bio = patch.bio ?? current?.bio ?? null;
    if (current) {
      await db
        .update(userProfiles)
        .set({ bio, socialLinks: social, updatedAt: Date.now() })
        .where(eq(userProfiles.userId, userId));
    } else {
      await db.insert(userProfiles).values({ userId, bio, socialLinks: social, createdAt: Date.now(), updatedAt: Date.now() });
    }
  }
}

export async function ensureProfileRowAndUsernameForNewUser(userId: string, name?: string | null, email?: string | null) {
  const db = getDatabase();
  const existingProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).get();
  if (!existingProfile) {
    await db.insert(userProfiles).values({ userId, createdAt: Date.now(), updatedAt: Date.now() });
  }
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return;
  if (!user.username || user.username === "") {
    // derive from email local-part or name
    const base = (email?.split("@")[0] || name || "user").toLowerCase().replace(/[^a-z0-9_-]/g, "");
    let candidate = base.slice(0, 20) || `user${Math.floor(Math.random() * 1000)}`;
    candidate = normalizeUsername(candidate);
    if (!isValidUsername(candidate)) candidate = `user${Math.floor(Math.random() * 10000)}`;
    // ensure unique by appending suffix
    let finalName = candidate;
    let i = 0;
    while (true) {
      const exists = await db.select().from(users).where(eq(users.username, finalName)).get();
      if (!exists) break;
      i += 1;
      finalName = `${candidate}${i}`.slice(0, 20);
    }
    await db.update(users).set({ username: finalName }).where(eq(users.id, userId));
  }
}
