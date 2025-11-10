import { and, desc, eq, isNull, like, inArray, or } from "drizzle-orm";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getToken } from "next-auth/jwt";
import { auth } from "@/auth";

import {
  gameCategories,
  postCommentLikes,
  postComments,
  postGameCategories,
  postLikes,
  posts,
  postTags,
  tags,
  users,
} from "@/db/schema";
import { GAMES } from "@/constants/games";
import { resolveGameCategoryCandidates } from "@/constants/gameCategoryMap";
import { markdownToHtml } from "@/lib/markdown";
import { getDatabase } from "@/lib/server/db";
import {
  addSettingComment,
  createSetting,
  getSettingById,
  getSettingComments,
  getSettingLikesCount,
  getSettingsList,
  toggleSettingLike,
} from "@/lib/services/server/settings";
import { normalizeTitle, toSlug } from "@/lib/slug";

import type { InferSelectModel } from "drizzle-orm";

const app = new Hono().basePath("/api");

type Tag = InferSelectModel<typeof tags>;
type GameCategory = InferSelectModel<typeof gameCategories>;

// 日本語ラベルを英語キーにマッピングする
const mapLabelToKey = (game: string, label: string): string => {
  const labelMappings: { [game: string]: { [label: string]: string } } = {
    APEX: {
      視点感度: "sensitivity",
      "視点感度（エイム時）": "aimSensitivity",
      反応曲線: "reactcurve",
      デッドゾーン: "deadZone",
    },
    VALORANT: {
      感度: "sensitivity",
    },
    OVERWATCH2: {
      感度: "sensitivity",
    },
  };

  return labelMappings[game]?.[label] || label;
};

// 設定の全件取得
app.get("/settings", async (c) => {
  try {
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const { data, pagination } = await getSettingsList({
      game: c.req.query("game"),
      fpsExperience: c.req.query("fpsExperience"),
      role: c.req.query("role"),
      character: c.req.query("character"),
      device: c.req.query("device"),
      limit,
      offset,
    });

    return c.json({ ok: true, data, pagination });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// 画像をクライアントから直接ImagesにアップロードするためのURL発行
app.get("/images/upload-token", async (c) => {
  console.log("画像アップロードトークン要求を受信");
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
    const nodeEnv = process.env.NODE_ENV;

    console.log(
      `NODE_ENV: ${nodeEnv}, CLOUDFLARE_ACCOUNT_ID: ${
        accountId ? "set" : "not set"
      }, CLOUDFLARE_IMAGES_API_TOKEN: ${apiToken ? "set" : "not set"}`,
    );

    // 開発環境またはCloudflare設定が不足している場合はローカルアップロードを使用
    if (nodeEnv === "development" || !accountId || !apiToken) {
      if (!accountId || !apiToken) {
        console.warn("Cloudflare設定が不足しています。ローカルモードで動作します。");
      }
      console.log("ローカルモードでトークンを返します");
      return c.json({
        ok: true,
        uploadUrl: "/api/images/local-upload",
        imageId: `local-${Date.now()}`,
        isLocal: true,
      });
    }

    console.log("Cloudflare API を呼び出します");
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`Cloudflare API レスポンスステータス: ${response.status}`);
    const uploadData = (await response.json()) as {
      success: boolean;
      result: { uploadURL: string; id: string };
    };
    console.log("Cloudflare API レスポンス:", JSON.stringify(uploadData));

    if (!uploadData.success) {
      console.error("Cloudflare API が失敗:", uploadData);
      return c.json({ ok: false, error: "アップロードURL取得に失敗" }, 500);
    }

    return c.json({
      ok: true,
      uploadUrl: uploadData.result.uploadURL,
      imageId: uploadData.result.id,
      isLocal: false,
    });
  } catch (error) {
    console.error("画像アップロードトークン取得エラー:", error);
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// 動画をR2にアップロードするためのURL発行
app.get("/videos/upload-token", async (c) => {
  console.log("動画アップロードトークン要求を受信");
  try {
    // R2の設定確認
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const nodeEnv = process.env.NODE_ENV;

    console.log(
      `NODE_ENV: ${nodeEnv}, R2_ACCESS_KEY_ID: ${
        r2AccessKeyId ? "set" : "not set"
      }, R2_SECRET_ACCESS_KEY: ${r2SecretAccessKey ? "set" : "not set"}, R2_BUCKET_NAME: ${
        r2BucketName ? "set" : "not set"
      }, CLOUDFLARE_ACCOUNT_ID: ${accountId ? "set" : "not set"}`,
    );

    // すべての環境で同一オリジンの local-upload を使用
    return c.json({
      ok: true,
      uploadUrl: "/api/videos/local-upload",
      videoId: `video-${Date.now()}`,
      isLocal: true,
    });
  } catch (error) {
    console.error("動画アップロードトークン取得エラー:", error);
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//空白の下書きを作成
app.post("/posts", async (c) => {
  try {
    // 認証チェック（HonoのContextから）
    const req = c.req.raw;
    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.sub) {
      return c.json(
        {
          ok: false,
          error: "ログインが必要です",
        },
        401,
      );
    }

    const db = getDatabase();

    // D1(Preview/Production) で稀に NextAuth のユーザー行がまだ無い場合がある。
    // その場合 userId 外部キーで挿入が失敗するため、存在確認して無ければ null にフォールバックする。
    let userIdToUse: string | null = token.sub;
    const allowNullOwner = (process.env.POSTS_ALLOW_NULL_USER ?? "0") === "1";
    try {
      const existingUser = await db.select().from(users).where(eq(users.id, token.sub)).get();
      if (!existingUser) {
        if (allowNullOwner) {
          console.warn(
            "[PostCreate] user not found in DB for sub; fallback to null (POSTS_ALLOW_NULL_USER=1)",
            token.sub,
          );
          userIdToUse = null;
        } else {
          console.warn(
            "[PostCreate] user not found in DB for sub; rejecting create (set POSTS_ALLOW_NULL_USER=1 to allow)",
            token.sub,
          );
          return c.json(
            { ok: false, error: "ユーザー情報が初期化されていません。サインイン後に再度お試しください。" },
            409,
          );
        }
      }
    } catch (e) {
      if (allowNullOwner) {
        // DB 到達前の例外はフォールバックで継続（下書き作成を止めない）
        console.warn("[PostCreate] user lookup failed; fallback to null", e);
        userIdToUse = null;
      } else {
        console.warn("[PostCreate] user lookup failed; rejecting create", e);
        return c.json(
          { ok: false, error: "ユーザー情報の確認に失敗しました。時間をおいて再試行してください。" },
          500,
        );
      }
    }

    // DrizzleAdapter にユーザー作成/リンクは委ねる（手動での upsert は行わない）

    const initialTitle = "無題の記事";
    const initialContent = "";
    const slug = toSlug(initialTitle);
    const norm = normalizeTitle(initialTitle);
    const contentHtml = await markdownToHtml(initialContent);
    const now = Date.now();

    const result = await db
      .insert(posts)
      .values({
        slug,
        title: initialTitle,
        content: initialContent,
        contentHtml,
        norm,
        status: "draft",
        userId: userIdToUse, // ユーザーID（未登録の場合は null で回避）
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return c.json({
      ok: true,
      post: result[0],
    });
  } catch (error) {
    // 外部キー制約などの詳細をログに残し、クライアントには簡潔なメッセージを返す
    console.error("[PostCreate] failed:", error);
    return c.json({ ok: false, error: "下書きの作成に失敗しました" }, 500);
  }
});

//タグの取得
app.get("/tags", async (c) => {
  try {
    const db = getDatabase();
    const query = c.req.query("q") || "";

    let result;

    if (query) {
      result = await db
        .select()
        .from(tags)
        .where(like(tags.name, `%${query}%`))
        .limit(10)
        .all();
    } else {
      const allTags = await db.select().from(tags).all();
      const withCounts = await Promise.all(
        allTags.map(async (tag) => {
          const postTagsCount = await db
            .select()
            .from(postTags)
            .where(eq(postTags.tagId, tag.id))
            .all();
          return {
            ...tag,
            count: postTagsCount.length,
          };
        }),
      );
      result = withCounts.sort((a, b) => b.count - a.count).slice(0, 20);
    }

    return c.json({
      ok: true,
      tags: result,
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

//ゲームカテゴリ一覧取得
app.get("/game-categories", async (c) => {
  try {
    const db = getDatabase();
    const result = await db.select().from(gameCategories).orderBy(gameCategories.name).all();

    return c.json({
      ok: true,
      gameCategories: result,
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

// 記事の更新
app.put("/posts/:id", async (c) => {
  try {
    const db = getDatabase();
    const id = Number(c.req.param("id"));
    const body = await c.req.json();

    if (isNaN(id)) {
      return c.json({ ok: false, error: "Invalid ID format" }, 400);
    }

    if (!body.title || !body.content) {
      return c.json({ ok: false, error: "タイトルと本文は必須です" }, 400);
    }

    if (body.tags && body.tags.length > 5) {
      return c.json({ ok: false, error: "タグは最大5つまでです" }, 400);
    }

    const contentHtml = await markdownToHtml(body.content);
    const norm = normalizeTitle(body.title);

    const result = await db
      .update(posts)
      .set({
        title: body.title,
        content: body.content,
        contentHtml,
        norm,
        status: body.status || "draft",
        updatedAt: Date.now(),
      })
      .where(eq(posts.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ ok: false, error: "記事が見つかりません" }, 404);
    }

    //タグの処理
    if (body.tags) {
      await db.delete(postTags).where(eq(postTags.postId, id));

      for (const tagName of body.tags) {
        if (!tagName || tagName.trim() === "") continue;

        const trimmedTagName = tagName.trim();
        const tagNorm = normalizeTitle(trimmedTagName);

        const existingTags = await db.select().from(tags).all();
        let tag = existingTags.find((t) => t.name === trimmedTagName);

        if (!tag) {
          const newTag = await db
            .insert(tags)
            .values({
              name: trimmedTagName,
              norm: tagNorm,
            })
            .returning();
          tag = newTag[0];
        }

        await db.insert(postTags).values({
          postId: id,
          tagId: tag.id,
        });
      }
    }

    // ゲームカテゴリの処理
    if (body.gameSlugs || body.gameCategories) {
      await db.delete(postGameCategories).where(eq(postGameCategories.postId, id));
      let inserted = 0;

      // 優先: slug ベース（なければ作成/紐付け）
      if (Array.isArray(body.gameSlugs) && body.gameSlugs.length > 0) {
        for (const slug of body.gameSlugs as string[]) {
          if (!slug || typeof slug !== 'string') continue;
          let cat = await db.select().from(gameCategories).where(eq(gameCategories.slug, slug)).get();
          if (!cat) {
            // try map via constants; if a row exists by name/displayName, backfill slug; otherwise insert
            const g = GAMES.find((x) => x.slug === slug);
            if (g) {
              const byName = await db
                .select()
                .from(gameCategories)
                .where(or(like(gameCategories.name, g.nameEn), like(gameCategories.displayName, g.nameEn)))
                .get();
              if (byName) {
                await db.update(gameCategories).set({ slug: slug, name: g.nameEn, displayName: g.nameEn }).where(eq(gameCategories.id, byName.id));
                cat = { ...byName, slug, name: g.nameEn, displayName: g.nameEn } as any;
              } else {
                const insertedCat = await db
                  .insert(gameCategories)
                  .values({ slug: slug, name: g.nameEn, displayName: g.nameEn, createdAt: Date.now() })
                  .returning();
                cat = insertedCat[0];
              }
            }
          }
          if (cat) {
            await db.insert(postGameCategories).values({ postId: id, gameCategoryId: (cat as any).id });
            inserted++;
          }
        }
      }

      // 後方互換: name ベース
      if (inserted === 0 && Array.isArray(body.gameCategories)) {
        for (const gameCategoryName of body.gameCategories as string[]) {
          if (!gameCategoryName || gameCategoryName.trim() === "") continue;
          const trimmedName = gameCategoryName.trim();
          const cat = await db.select().from(gameCategories).where(eq(gameCategories.name, trimmedName)).get();
          if (cat) {
            await db.insert(postGameCategories).values({ postId: id, gameCategoryId: cat.id });
          }
        }
      }
    }

    const postTagRelations = await db.select().from(postTags).where(eq(postTags.postId, id)).all();
    const tagIds = postTagRelations.map((pt) => pt.tagId);
    let updatedPostTags: Tag[] = [];

    if (tagIds.length > 0) {
      const allTags = await db.select().from(tags).all();
      updatedPostTags = allTags.filter((tag) => tagIds.includes(tag.id));
    }

    const postGameCategoryRelations = await db
      .select()
      .from(postGameCategories)
      .where(eq(postGameCategories.postId, id))
      .all();

    const gameCategoryIds = postGameCategoryRelations.map((pgc) => pgc.gameCategoryId);
    let updatedPostGameCategories: GameCategory[] = [];
    if (gameCategoryIds.length > 0) {
      const allGameCategories = await db.select().from(gameCategories).all();
      updatedPostGameCategories = allGameCategories.filter((gc) => gameCategoryIds.includes(gc.id));
    }

    return c.json({
      ok: true,
      post: {
        ...result[0],
        tags: updatedPostTags,
        gameCategories: updatedPostGameCategories,
      },
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

// 記事の個別取得
app.get("/posts/:id", async (c) => {
  try {
    const db = getDatabase();
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ ok: false, error: "Invalid ID format" }, 400);
    }

    const post = await db.select().from(posts).where(eq(posts.id, id)).get();

    if (!post) {
      return c.json({ ok: false, error: "記事が見つかりません" }, 404);
    }

    // ユーザー情報を取得
    let user = null;
    if (post.userId) {
      const userResult = await db.select().from(users).where(eq(users.id, post.userId)).get();
      if (userResult) {
        user = {
          id: userResult.id,
          name: userResult.name,
          image: userResult.image,
        };
      }
    }

    //タグ取得
    const postTagRelations = await db.select().from(postTags).where(eq(postTags.postId, id)).all();

    const tagIds = postTagRelations.map((pt) => pt.tagId);
    let postTagsResult: Tag[] = [];

    if (tagIds.length > 0) {
      const allTags = await db.select().from(tags).all();
      postTagsResult = allTags.filter((tag) => tagIds.includes(tag.id));
    }

    // ゲームカテゴリ取得
    const postGameCategoryRelations = await db
      .select()
      .from(postGameCategories)
      .where(eq(postGameCategories.postId, id))
      .all();

    const gameCategoryIds = postGameCategoryRelations.map((pgc) => pgc.gameCategoryId);
    let postGameCategoriesResult: GameCategory[] = [];

    if (gameCategoryIds.length > 0) {
      const allGameCategories = await db.select().from(gameCategories).all();
      postGameCategoriesResult = allGameCategories.filter((gc) => gameCategoryIds.includes(gc.id));
    }

    return c.json({
      ok: true,
      post: {
        ...post,
        user: user,
        tags: postTagsResult,
        gameCategories: postGameCategoriesResult,
      },
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

//公開記事一覧を取得
app.get("/posts", async (c) => {
  try {
    const db = getDatabase();

    const status = c.req.query("status") || "published";
    const limit = Number(c.req.query("limit")) || 10;
    const offset = Number(c.req.query("offset")) || 0;
    const game = c.req.query("game") || "";

    let result;

    if (status == "published") {
      // optional game filter (prefer slug match; fallback to LIKE for legacy data)
      if (game) {
        const bySlug = await db.select().from(gameCategories).where(eq(gameCategories.slug, game)).get();
        if (bySlug) {
          const rel = await db
            .select({ postId: postGameCategories.postId })
            .from(postGameCategories)
            .where(eq(postGameCategories.gameCategoryId, bySlug.id))
            .all();
          const postIds = Array.from(new Set(rel.map((r) => r.postId)));
          result = postIds.length
            ? await db
                .select()
                .from(posts)
                .where(and(eq(posts.status, "published"), inArray(posts.id, postIds)))
                .orderBy(desc(posts.createdAt))
                .limit(limit + 1)
                .offset(offset)
                .all()
            : [];
        } else {
          // Fallback: name LIKE candidates
          const fromGames = GAMES.find((g) => g.slug === game);
          const candidates = resolveGameCategoryCandidates(game, fromGames?.nameEn);
          const likeConds = candidates.map((n) => like(gameCategories.name, `%${n}%`));
          const matchedCats = likeConds.length
            ? await db.select().from(gameCategories).where(or(...likeConds)).all()
            : [];
          const catIds = matchedCats.map((gc) => gc.id);
          if (catIds.length === 0) {
            result = [];
          } else {
            const rel = await db
              .select({ postId: postGameCategories.postId })
              .from(postGameCategories)
              .where(inArray(postGameCategories.gameCategoryId, catIds))
              .all();
            const postIdSet = Array.from(new Set(rel.map((r) => r.postId)));
            if (postIdSet.length === 0) {
              result = [];
            } else {
              result = await db
                .select()
                .from(posts)
                .where(and(eq(posts.status, "published"), inArray(posts.id, postIdSet)))
                .orderBy(desc(posts.createdAt))
                .limit(limit + 1)
                .offset(offset)
                .all();
            }
          }
        }
      } else {
        result = await db
          .select()
          .from(posts)
          .where(eq(posts.status, "published"))
          .orderBy(desc(posts.createdAt))
          .limit(limit + 1)
          .offset(offset)
          .all();
      }
    } else if (status == "draft") {
      result = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "draft"))
        .orderBy(desc(posts.createdAt))
        .limit(limit + 1)
        .offset(offset)
        .all();
    } else {
      if (game) {
        const bySlug = await db.select().from(gameCategories).where(eq(gameCategories.slug, game)).get();
        if (bySlug) {
          const rel = await db
            .select({ postId: postGameCategories.postId })
            .from(postGameCategories)
            .where(eq(postGameCategories.gameCategoryId, bySlug.id))
            .all();
          const postIdSet = Array.from(new Set(rel.map((r) => r.postId)));
          result = postIdSet.length
            ? await db
                .select()
                .from(posts)
                .where(inArray(posts.id, postIdSet))
                .orderBy(desc(posts.createdAt))
                .limit(limit + 1)
                .offset(offset)
                .all()
            : [];
        } else {
          const fromGames = GAMES.find((g) => g.slug === game);
          const candidates = resolveGameCategoryCandidates(game, fromGames?.nameEn);
          const likeConds = candidates.map((n) => like(gameCategories.name, `%${n}%`));
          const matchedCats = likeConds.length
            ? await db.select().from(gameCategories).where(or(...likeConds)).all()
            : [];
          const catIds = matchedCats.map((gc) => gc.id);
          if (catIds.length === 0) {
            result = [];
          } else {
            const rel = await db
              .select({ postId: postGameCategories.postId })
              .from(postGameCategories)
              .where(inArray(postGameCategories.gameCategoryId, catIds))
              .all();
            const postIdSet = Array.from(new Set(rel.map((r) => r.postId)));
            result = postIdSet.length
              ? await db
                  .select()
                  .from(posts)
                  .where(inArray(posts.id, postIdSet))
                  .orderBy(desc(posts.createdAt))
                  .limit(limit + 1)
                  .offset(offset)
                  .all()
              : [];
          }
        }
      } else {
        result = await db
          .select()
          .from(posts)
          .orderBy(desc(posts.createdAt))
          .limit(limit + 1)
          .offset(offset)
          .all();
      }
    }

    const hasMore = result.length > limit;
    const actualData = hasMore ? result.slice(0, limit) : result;

    const postWithMetadata = await Promise.all(
      actualData.map(async (post) => {
        // ユーザー情報を取得
        let user = null;
        if (post.userId) {
          const userResult = await db.select().from(users).where(eq(users.id, post.userId)).get();
          if (userResult) {
            user = {
              id: userResult.id,
              name: userResult.name,
              image: userResult.image,
            };
          }
        }
        const postTagRelations = await db
          .select()
          .from(postTags)
          .where(eq(postTags.postId, post.id))
          .all();
        const tagIds = postTagRelations.map((pt) => pt.tagId);
        let postTagsResult: Tag[] = [];

        if (tagIds.length > 0) {
          const allTags = await db.select().from(tags).all();
          postTagsResult = allTags.filter((tag) => tagIds.includes(tag.id));
        }

        const postGameCategoryRelations = await db
          .select()
          .from(postGameCategories)
          .where(eq(postGameCategories.postId, post.id))
          .all();
        const gameCategoryIds = postGameCategoryRelations.map((pgc) => pgc.gameCategoryId);
        let postGameCategoriesResult: GameCategory[] = [];
        if (gameCategoryIds.length > 0) {
          const allGameCategories = await db.select().from(gameCategories).all();
          postGameCategoriesResult = allGameCategories.filter((gc) =>
            gameCategoryIds.includes(gc.id),
          );
        }
        return {
          ...post,
          user: user,
          tags: postTagsResult,
          gameCategories: postGameCategoriesResult,
          excerpt:
            post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content,
        };
      }),
    );
    return c.json({
      ok: true,
      posts: postWithMetadata,
      pagination: {
        limit,
        offset,
        hasMore,
        total: postWithMetadata.length,
      },
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

//記事のいいね数を取得
app.get("/posts/:id/likes/count", async (c) => {
  try {
    const db = getDatabase();
    const idParam = c.req.param("id");
    const postId = Number(idParam);

    if (isNaN(postId)) {
      return c.json({ ok: false, error: "Invalid post ID format" }, 400);
    }

    const result = await db.select().from(postLikes).where(eq(postLikes.postId, postId)).all();
    return c.json({
      ok: true,
      likesCount: result.length,
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

//記事のいいね追加/削除
app.post("/posts/:id/likes", async (c) => {
  try {
    const db = getDatabase();
    const idParam = c.req.param("id");
    const postId = Number(idParam);

    if (isNaN(postId)) {
      return c.json({ ok: false, error: "Invalid post ID format" }, 400);
    }

    const body = await c.req.json();
    const session = await auth();
    const userIdentifier = (session?.user as any)?.id ?? body.userIdentifier;

    if (!userIdentifier) {
      return c.json({ ok: false, error: "User identifier is required" }, 400);
    }

    // 既存のいいねを確認
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userIdentifier, userIdentifier)))
      .get();

    if (existingLike) {
      // いいねが既に存在する場合は削除
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userIdentifier, userIdentifier)));
      return c.json({ ok: true, message: "Like removed successfully" });
    } else {
      // いいねが存在しない場合は追加
      await db.insert(postLikes).values({
        postId: postId,
        userIdentifier: userIdentifier,
      });
      return c.json({ ok: true, message: "Like added successfully" });
    }
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

// 記事のコメント数取得
app.get("/posts/:id/comments/count", async (c) => {
  try {
    const db = getDatabase();
    const idParam = c.req.param("id");
    const postId = Number(idParam);

    if (isNaN(postId)) {
      return c.json({ ok: false, error: "Invalid post ID format" }, 400);
    }

    const result = await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .all();

    return c.json({
      ok: true,
      commentsCount: result.length,
    });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//記事のコメントを取得
app.get("/posts/:id/comments", async (c) => {
  try {
    const db = getDatabase();
    const idParam = c.req.param("id");
    const postId = Number(idParam);
    const userIdentifier = c.req.query("userIdentifier");

    console.log("=== GET コメント デバッグ ===");
    console.log("postId:", postId);

    if (isNaN(postId)) {
      return c.json({ ok: false, error: "Invalid post ID format" }, 400);
    }

    const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

    console.log("記事検索結果:", post);

    if (!post) {
      return c.json(
        {
          ok: false,
          error: "記事が見つかりません",
          debug: postId,
        },
        404,
      );
    }

    console.log("記事ステータス:", post.status);

    if (post.status !== "published") {
      return c.json(
        {
          ok: false,
          error: "公開されていない記事のコメントは取得できません",
          debug: post.status,
        },
        403,
      );
    }

    console.log("記事確認OK");

    const limit = Number(c.req.query("limit")) || 20;
    const offset = Number(c.req.query("offset")) || 0;

    const parentComments = await db
      .select()
      .from(postComments)
      .where(and(eq(postComments.postId, postId), isNull(postComments.parentId)))
      .orderBy(desc(postComments.createdAt))
      .limit(limit + 1)
      .offset(offset)
      .all();
    const hasMore = parentComments.length > limit;
    const actualData = hasMore ? parentComments.slice(0, limit) : parentComments;

    // 各コメントのメタデータを取得
    const commentsWithMetadata = await Promise.all(
      actualData.map(async (comment) => {
        // いいね数を取得
        const likes = await db
          .select()
          .from(postCommentLikes)
          .where(eq(postCommentLikes.commentId, comment.id))
          .all();

        // ユーザーがいいねしているか確認
        const isLiked = userIdentifier
          ? likes.some((like) => like.userIdentifier === userIdentifier)
          : false;

        // 返信数を取得
        const replies = await db
          .select()
          .from(postComments)
          .where(eq(postComments.parentId, comment.id))
          .all();

        return {
          ...comment,
          likesCount: likes.length,
          isLiked,
          repliesCount: replies.length,
          author: comment.author || "匿名ユーザー",
          createdAt: comment.createdAt
            ? new Date(comment.createdAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        };
      }),
    );

    return c.json({
      ok: true,
      comments: commentsWithMetadata,
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

// コメント投稿（返信対応）
app.post("/posts/:id/comments", async (c) => {
  try {
    const db = getDatabase();
    const idParam = c.req.param("id");
    const postId = Number(idParam);

    if (isNaN(postId)) {
      return c.json({ ok: false, error: "Invalid post ID format" }, 400);
    }

    const body = await c.req.json();

    // バリデーション
    if (!body.content || typeof body.content !== "string" || body.content.trim().length === 0) {
      return c.json({ ok: false, error: "コメント内容は必須です" }, 400);
    }

    if (body.content.trim().length > 500) {
      return c.json({ ok: false, error: "コメントは500文字以下で入力してください" }, 400);
    }

    // 返信の場合、親コメントの存在確認
    if (body.parentId) {
      const parentComment = await db
        .select()
        .from(postComments)
        .where(eq(postComments.id, body.parentId))
        .get();

      if (!parentComment) {
        return c.json({ ok: false, error: "返信先が見つかりません" }, 404);
      }
    }

    // 記事の存在確認
    const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

    if (!post || post.status !== "published") {
      return c.json({ ok: false, error: "記事が見つかりません", debug: postId }, 404);
    }

    // データベースに挿入
    const result = await db
      .insert(postComments)
      .values({
        postId: postId,
        parentId: body.parentId || null,
        content: body.content.trim(),
        author: body.author || null,
        userIdentifier: body.userIdentifier || null,
      })
      .returning();

    const insertedComment = result[0];
    const transformedComment = {
      id: insertedComment.id,
      postId: insertedComment.postId,
      parentId: insertedComment.parentId,
      content: insertedComment.content,
      author: insertedComment.author || "匿名ユーザー",
      likesCount: 0,
      isLiked: false,
      repliesCount: 0,
      createdAt: insertedComment.createdAt
        ? new Date(insertedComment.createdAt).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    };

    return c.json({
      ok: true,
      comment: transformedComment,
    });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// 特定コメントの返信を取得
app.get("/posts/:postId/comments/:commentId/replies", async (c) => {
  try {
    const db = getDatabase();
    const commentId = Number(c.req.param("commentId"));
    const userIdentifier = c.req.query("userIdentifier");

    if (isNaN(commentId)) {
      return c.json({ ok: false, error: "Invalid comment ID　format" }, 400);
    }

    // 返信コメントを取得
    const replies = await db
      .select()
      .from(postComments)
      .where(eq(postComments.parentId, commentId))
      .orderBy(postComments.createdAt)
      .all();

    // 各返信のメタデータを取得
    const repliesWithMetadata = await Promise.all(
      replies.map(async (reply) => {
        const likes = await db
          .select()
          .from(postCommentLikes)
          .where(eq(postCommentLikes.commentId, reply.id))
          .all();

        const isLiked = userIdentifier
          ? likes.some((like) => like.userIdentifier === userIdentifier)
          : false;

        // 返信の返信数を取得
        const subReplies = await db
          .select()
          .from(postComments)
          .where(eq(postComments.parentId, reply.id))
          .all();

        return {
          ...reply,
          likesCount: likes.length,
          isLiked,
          repliesCount: subReplies.length,
          author: reply.author || "匿名ユーザー",
          createdAt: reply.createdAt
            ? new Date(reply.createdAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        };
      }),
    );

    return c.json({
      ok: true,
      replies: repliesWithMetadata,
    });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// コメントにいいね
app.post("/posts/:postId/comments/:commentId/likes", async (c) => {
  try {
    const db = getDatabase();
    const commentId = Number(c.req.param("commentId"));

    if (isNaN(commentId)) {
      return c.json({ ok: false, error: "Invalid comment ID format" }, 400);
    }

    const body = await c.req.json();
    const session = await auth();
    const userIdentifier = (session?.user as any)?.id ?? body.userIdentifier;

    if (!userIdentifier) {
      return c.json({ ok: false, error: "User identifier is required" }, 400);
    }

    // 既存のいいねを確認
    const existingLike = await db
      .select()
      .from(postCommentLikes)
      .where(
        and(
          eq(postCommentLikes.commentId, commentId),
          eq(postCommentLikes.userIdentifier, userIdentifier),
        ),
      )
      .get();

    if (existingLike) {
      // いいねを削除
      await db
        .delete(postCommentLikes)
        .where(
          and(
            eq(postCommentLikes.commentId, commentId),
            eq(postCommentLikes.userIdentifier, userIdentifier),
          ),
        );
      return c.json({ ok: true, liked: false });
    } else {
      // いいねを追加
      await db.insert(postCommentLikes).values({
        commentId: commentId,
        userIdentifier: userIdentifier,
      });
      return c.json({ ok: true, liked: true });
    }
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// 公開ページでの記事表示（スラッグで取得）
app.get("/posts/:id/:slug", async (c) => {
  try {
    const db = getDatabase();
    const slug = c.req.param("slug");

    const result = await db.select().from(posts).where(eq(posts.slug, slug)).get();

    if (!result) {
      return c.json({ ok: false, error: "記事が見つかりません", debug: `slug: ${slug}` }, 404);
    }

    return c.json({
      ok: true,
      post: result,
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

// 設定新規作成
app.post("/settings", async (c) => {
  try {
    const body = await c.req.json();

    // 基本的なバリデーション（zodの代わり）
    if (!body.game || !body.role || typeof body.dpi !== "number") {
      return c.json(
        {
          ok: false,
          error: "game, role, dpi are required fields",
        },
        400,
      );
    }

    // 日本語ラベルを英語キーに変換
    const mappedSliders: { [key: string]: any } = {};
    if (body.sliders) {
      Object.entries(body.sliders).forEach(([label, value]) => {
        const key = mapLabelToKey(body.game, label);
        mappedSliders[key] = value;
      });
    }

    const mappedSelects: { [key: string]: any } = {};
    if (body.selects) {
      Object.entries(body.selects).forEach(([label, value]) => {
        const key = mapLabelToKey(body.game, label);
        mappedSelects[key] = value;
      });
    }

    // ゲーム固有設定を準備
    const gameSpecificSettings = {
      ...mappedSliders,
      ...mappedSelects,
    };
    const id = await createSetting({
      game: body.game,
      role: body.role,
      dpi: body.dpi,
      comment: body.comment,
      fpsExperience: body.fpsExperience,
      character: body.character,
      device: body.device,
      gameSpecificSettings,
    });
    return c.json({ ok: true, id });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//特定の投稿を取得する
app.get("/settings/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ ok: false, error: "Invalid ID format" }, 400);
    const data = await getSettingById(id);
    if (!data) return c.json({ ok: false, error: "Setting not found" }, 404);
    return c.json({ ok: true, data });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//コメントを取得する
app.get("/settings/:id/comments", async (c) => {
  try {
    const settingId = Number(c.req.param("id"));
    if (isNaN(settingId)) return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    const comments = await getSettingComments(settingId);
    return c.json({ ok: true, comments });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//いいね数を取得
app.get("/settings/:id/likes/count", async (c) => {
  try {
    const settingId = Number(c.req.param("id"));
    if (isNaN(settingId)) return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    const likesCount = await getSettingLikesCount(settingId);
    return c.json({ ok: true, likesCount });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// コメント作成
app.post("/settings/:id/comments", async (c) => {
  try {
    const settingId = Number(c.req.param("id"));
    if (isNaN(settingId)) return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    const body = await c.req.json();
    if (!body.content || typeof body.content !== "string" || body.content.trim().length === 0) {
      return c.json({ ok: false, error: "コメント内容は必須です" }, 400);
    }
    const comment = await addSettingComment(settingId, body.content, body.author);
    return c.json({ ok: true, comment });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// いいねを追加/削除する
app.post("/settings/:id/likes", async (c) => {
  try {
    const settingId = Number(c.req.param("id"));
    if (isNaN(settingId)) return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    const body = await c.req.json();
    const userIdentifier = body.userIdentifier as string | undefined;
    if (!userIdentifier) return c.json({ ok: false, error: "userIdentifier is required" }, 400);
    const result = await toggleSettingLike(settingId, userIdentifier);
    const message = (result as any).removed
      ? "Like removed successfully"
      : "Like added successfully";
    return c.json({ ok: true, message });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

// 記事の削除
app.delete("/posts/:id", async (c) => {
  try {
    const db = getDatabase();
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ ok: false, error: "Invalid ID format" }, 400);
    }

    // 記事が存在するかチェック
    const existingPost = await db.select().from(posts).where(eq(posts.id, id)).get();

    if (!existingPost) {
      return c.json({ ok: false, error: "記事が見つかりません" }, 404);
    }

    // 記事を削除
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();

    if (result.length === 0) {
      return c.json({ ok: false, error: "削除に失敗しました" }, 500);
    }

    return c.json({
      ok: true,
      message: "記事が削除されました",
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500,
    );
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
