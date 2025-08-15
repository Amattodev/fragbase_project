import { Hono } from "hono";
import { eq, and, desc, like, isNull } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import {
  settings,
  comments,
  likes,
  posts,
  tags,
  postTags,
  gameCategories,
  postGameCategories,
  postLikes,
  postComments,
  postCommentLikes,
} from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import { toSlug, normalizeTitle } from "@/lib/slug";
import { handle } from "hono/vercel";
import { getRoleLabel } from "@/constants/role";
import { getFpsExperienceLabel } from "@/constants/fpsExperience";
import { getDpiLabel } from "@/constants/dpi";
import { getDeviceLabel } from "@/constants/device";
import { Tag } from "lucide-react";
import { debug } from "console";

const app = new Hono().basePath("/api");

type Setting = InferSelectModel<typeof settings>;
type Comment = InferSelectModel<typeof comments>;
type Tag = InferSelectModel<typeof tags>;
type GameCategory = InferSelectModel<typeof gameCategories>;
type PostComment = InferSelectModel<typeof postComments>;
type PostCommentLike = InferSelectModel<typeof postCommentLikes>;

type GameSpecificSettings = {
  sensitivity?: number;
  aimSensitivity?: number;
  reactcurve?: string;
  deadZone?: string;
  scopedSensitivity?: number;
  aimAssist?: string;
  [key: string]: any;
};

interface CommentWithMetadata extends PostComment {
  likesCount: number;
  isLiked?: boolean;
  repliesCount: number;
  author: string;
  createdAt: string;
}

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
    const db = getDatabase();

    //クエリパラメータ取得
    const gameFilter = c.req.query("game");
    const fpsExperienceFilter = c.req.query("fpsExperience");
    const roleFilter = c.req.query("role");
    const characterFilter = c.req.query("character");
    const deviceFilter = c.req.query("device");
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const whereConditions = [];

    if (gameFilter) {
      whereConditions.push(eq(settings.game, gameFilter));
    }
    if (fpsExperienceFilter) {
      whereConditions.push(eq(settings.fpsExperience, fpsExperienceFilter));
    }
    if (roleFilter) {
      whereConditions.push(eq(settings.role, roleFilter));
    }
    if (characterFilter) {
      whereConditions.push(eq(settings.character, characterFilter));
    }
    if (deviceFilter) {
      whereConditions.push(eq(settings.device, deviceFilter));
    }

    //データ取得
    const result =
      whereConditions.length > 0
        ? await db
            .select()
            .from(settings)
            .where(
              whereConditions.length === 1
                ? whereConditions[0]
                : and(...whereConditions)
            )
            .orderBy(desc(settings.createdAt))
            .limit(limit + 1)
            .offset(offset)
            .all()
        : await db
            .select()
            .from(settings)
            .orderBy(desc(settings.createdAt))
            .limit(limit + 1)
            .offset(offset)
            .all();

    const hasMore = result.length > limit;
    const actualData = hasMore ? result.slice(0, limit) : result;

    // いいね数を取得する関数;
    const getLikesCount = async (settingId: number) => {
      const result = await db
        .select()
        .from(likes)
        .where(eq(likes.settingId, settingId))
        .all();
      return result.length || 0;
    };
    //データを変換
    const transformedData = await Promise.all(
      actualData.map(async (setting: Setting) => {
        let gameSpecificSettings: GameSpecificSettings = {};
        try {
          gameSpecificSettings = setting.gameSpecificSettings
            ? (JSON.parse(setting.gameSpecificSettings) as GameSpecificSettings)
            : {};
        } catch (e) {
          console.error("JSON parse error:", e);
        }
        const roleLabel = getRoleLabel(setting.game, setting.role);
        const fpsExperienceLabel = getFpsExperienceLabel(setting.fpsExperience);
        const dpiLabel = getDpiLabel(setting.dpi);
        const deviceLabel = getDeviceLabel(setting.device || "マウス");
        const likesCount = await getLikesCount(setting.id);

        // ゲームタイトルに応じた変換
        // TODO:カウント情報を追加する
        const baseData = {
          id: setting.id,
          gameTitle: setting.game,
          role: roleLabel,
          dpi: dpiLabel,
          comment: setting.comment || "",
          createdAt: setting.createdAt
            ? new Date(setting.createdAt).toISOString().split("T")[0]
            : "",
          fpsExperience: fpsExperienceLabel,
          character: setting.character || "不明",
          device: deviceLabel,
          likesCount: likesCount,
        };

        // ゲーム固有の設定を追加
        switch (setting.game) {
          case "APEX":
            return {
              ...baseData,
              sensitivity: gameSpecificSettings.sensitivity || 0,
              aimSensitivity: gameSpecificSettings.aimSensitivity || 0,
              reactcurve: gameSpecificSettings.reactcurve || "リニア",
              deadZone: gameSpecificSettings.deadZone || "なし",
            };
          case "VALORANT":
            return {
              ...baseData,
              sensitivity: gameSpecificSettings.sensitivity || 0,
            };
          case "OVERWATCH2":
            return {
              ...baseData,
              sensitivity: gameSpecificSettings.sensitivity || 0,
            };
          default:
            return {
              ...baseData,
              sensitivity: 0,
            };
        }
      })
    );

    return c.json({
      ok: true,
      data: transformedData,
      pagination: {
        limit,
        offset,
        hasMore,
        currentPage: Math.floor(offset / limit) + 1,
      },
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// 画像をクライアントから直接ImagesにアップロードするためのURL発行
app.get("/images/upload-token", async (c) => {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      return c.json({ ok: false, error: "Cloudflare設定が不正です" }, 500);
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const uploadData = await response.json();
    if (!uploadData.success) {
      return c.json({ ok: false, error: "アップロードURL取得に失敗" }, 500);
    }

    return c.json({
      ok: true,
      uploadUrl: uploadData.result.uploadURL,
      imageId: uploadData.result.id,
    });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//空白の下書きを作成
app.post("/posts", async (c) => {
  try {
    const db = getDatabase();

    const initialTitle = "無題の記事";
    const initialContent = "";
    const slug = toSlug(initialTitle);
    const norm = normalizeTitle(initialTitle);
    const contentHtml = await markdownToHtml(initialContent);

    const result = await db
      .insert(posts)
      .values({
        slug,
        title: initialTitle,
        content: initialContent,
        contentHtml,
        norm,
        status: "draft",
      })
      .returning();

    return c.json({
      ok: true,
      post: result[0],
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500
    );
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
        })
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
      500
    );
  }
});

//ゲームカテゴリ一覧取得
app.get("/game-categories", async (c) => {
  try {
    const db = getDatabase();
    const result = await db
      .select()
      .from(gameCategories)
      .orderBy(gameCategories.name)
      .all();

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
      500
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
    if (body.gameCategories) {
      await db
        .delete(postGameCategories)
        .where(eq(postGameCategories.postId, id));

      for (const gameCategoryName of body.gameCategories) {
        if (!gameCategoryName || gameCategoryName.trim() === "") continue;

        const trimmedName = gameCategoryName.trim();
        const existingCategories = await db.select().from(gameCategories).all();
        const gameCategory = existingCategories.find(
          (gc) => gc.name === trimmedName
        );

        if (gameCategory) {
          await db.insert(postGameCategories).values({
            postId: id,
            gameCategoryId: gameCategory.id,
          });
        }
      }
    }

    const postTagRelations = await db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, id))
      .all();
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

    const gameCategoryIds = postGameCategoryRelations.map(
      (pgc) => pgc.gameCategoryId
    );
    let updatedPostGameCategories: GameCategory[] = [];
    if (gameCategoryIds.length > 0) {
      const allGameCategories = await db.select().from(gameCategories).all();
      updatedPostGameCategories = allGameCategories.filter((gc) =>
        gameCategoryIds.includes(gc.id)
      );
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
      500
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

    //タグ取得
    const postTagRelations = await db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, id))
      .all();

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

    const gameCategoryIds = postGameCategoryRelations.map(
      (pgc) => pgc.gameCategoryId
    );
    let postGameCategoriesResult: GameCategory[] = [];

    if (gameCategoryIds.length > 0) {
      const allGameCategories = await db.select().from(gameCategories).all();
      postGameCategoriesResult = allGameCategories.filter((gc) =>
        gameCategoryIds.includes(gc.id)
      );
    }

    return c.json({
      ok: true,
      post: {
        ...post,
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
      500
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

    let result;

    if (status == "published") {
      result = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.createdAt))
        .limit(limit + 1)
        .offset(offset)
        .all();
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
      result = await db
        .select()
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(limit + 1)
        .offset(offset)
        .all();
    }

    const hasMore = result.length > limit;
    const actualData = hasMore ? result.slice(0, limit) : result;

    const postWithMetadata = await Promise.all(
      actualData.map(async (post) => {
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
        const gameCategoryIds = postGameCategoryRelations.map(
          (pgc) => pgc.gameCategoryId
        );
        let postGameCategoriesResult: GameCategory[] = [];
        if (gameCategoryIds.length > 0) {
          const allGameCategories = await db
            .select()
            .from(gameCategories)
            .all();
          postGameCategoriesResult = allGameCategories.filter((gc) =>
            gameCategoryIds.includes(gc.id)
          );
        }
        return {
          ...post,
          tags: postTagsResult,
          gameCategories: postGameCategoriesResult,
          excerpt:
            post.content.length > 150
              ? post.content.substring(0, 150) + "..."
              : post.content,
        };
      })
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
      500
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

    const result = await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.postId, postId))
      .all();
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
      500
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
    const userIdentifier = body.userIdentifier;

    if (!userIdentifier) {
      return c.json({ ok: false, error: "User identifier is required" }, 400);
    }

    // 既存のいいねを確認
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userIdentifier, userIdentifier)
        )
      )
      .get();

    if (existingLike) {
      // いいねが既に存在する場合は削除
      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userIdentifier, userIdentifier)
          )
        );
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
      500
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

    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .get();

    console.log("記事検索結果:", post);

    if (!post) {
      return c.json(
        {
          ok: false,
          error: "記事が見つかりません",
          debug: postId,
        },
        404
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
        403
      );
    }

    console.log("記事確認OK");

    const limit = Number(c.req.query("limit")) || 20;
    const offset = Number(c.req.query("offset")) || 0;

    const parentComments = await db
      .select()
      .from(postComments)
      .where(
        and(eq(postComments.postId, postId), isNull(postComments.parentId))
      )
      .orderBy(desc(postComments.createdAt))
      .limit(limit + 1)
      .offset(offset)
      .all();
    const hasMore = parentComments.length > limit;
    const actualData = hasMore
      ? parentComments.slice(0, limit)
      : parentComments;

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
      })
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
      500
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
    if (
      !body.content ||
      typeof body.content !== "string" ||
      body.content.trim().length === 0
    ) {
      return c.json({ ok: false, error: "コメント内容は必須です" }, 400);
    }

    if (body.content.trim().length > 500) {
      return c.json(
        { ok: false, error: "コメントは500文字以下で入力してください" },
        400
      );
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
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .get();

    if (!post || post.status !== "published") {
      return c.json(
        { ok: false, error: "記事が見つかりません", debug: postId },
        404
      );
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
      })
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
    const userIdentifier = body.userIdentifier;

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
          eq(postCommentLikes.userIdentifier, userIdentifier)
        )
      )
      .get();

    if (existingLike) {
      // いいねを削除
      await db
        .delete(postCommentLikes)
        .where(
          and(
            eq(postCommentLikes.commentId, commentId),
            eq(postCommentLikes.userIdentifier, userIdentifier)
          )
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

    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .get();

    if (!result) {
      return c.json(
        { ok: false, error: "記事が見つかりません", debug: `slug: ${slug}` },
        404
      );
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
      500
    );
  }
});

// 設定新規作成
app.post("/settings", async (c) => {
  try {
    const db = getDatabase();

    const body = await c.req.json();

    // 基本的なバリデーション（zodの代わり）
    if (!body.game || !body.role || typeof body.dpi !== "number") {
      return c.json(
        {
          ok: false,
          error: "game, role, dpi are required fields",
        },
        400
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

    // ゲーム固有設定をJSON文字列として準備
    const gameSpecificSettings = {
      ...mappedSliders,
      ...mappedSelects,
    };

    const insertData = {
      game: body.game,
      role: body.role,
      dpi: body.dpi,
      comment: body.comment,
      fpsExperience: body.fpsExperience,
      character: body.character,
      device: body.device,
      gameSpecificSettings: JSON.stringify(gameSpecificSettings),
    };

    // DBにデータを挿入する
    const result = await db.insert(settings).values(insertData).returning();

    // 成功時に挿入したデータのIDを返す
    return c.json({
      ok: true,
      id: result[0].id,
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

//特定の投稿を取得する
app.get("/settings/:id", async (c) => {
  try {
    const db = getDatabase();

    const idParam = c.req.param("id");
    const id = Number(idParam);

    if (isNaN(id)) {
      return c.json({ ok: false, error: "Invalid ID format" }, 400);
    }

    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.id, id))
      .get();

    if (!result) {
      return c.json({ ok: false, error: "Setting not found" }, 404);
    }

    // ゲーム固有設定をパース
    let gameSpecificSettings: GameSpecificSettings = {};
    try {
      gameSpecificSettings = result.gameSpecificSettings
        ? (JSON.parse(result.gameSpecificSettings) as GameSpecificSettings)
        : {};
    } catch (e) {
      console.error("JSON parse error:", e);
    }

    const roleLabel = getRoleLabel(result.game, result.role);
    const fpsExperienceLabel = getFpsExperienceLabel(result.fpsExperience);
    const dpiLabel = getDpiLabel(result.dpi);
    const deviceLabel = getDeviceLabel(result.device || "マウス");

    // フロントエンドの型に合わせてデータを変換
    const baseData = {
      id: result.id,
      gameTitle: result.game,
      role: roleLabel,
      dpi: dpiLabel,
      comment: result.comment || "",
      createdAt: result.createdAt
        ? new Date(result.createdAt).toISOString().split("T")[0]
        : "",
      fpsExperience: fpsExperienceLabel,
      character: result.character || "不明",
      device: deviceLabel,
    };

    // ゲーム固有の設定を追加
    let transformedData;
    switch (result.game) {
      case "APEX":
        transformedData = {
          ...baseData,
          sensitivity: gameSpecificSettings.sensitivity || 0,
          aimSensitivity: gameSpecificSettings.aimSensitivity || 0,
          reactcurve: gameSpecificSettings.reactcurve || "リニア",
          deadZone: gameSpecificSettings.deadZone || "なし",
        };
        break;
      case "VALORANT":
        transformedData = {
          ...baseData,
          sensitivity: gameSpecificSettings.sensitivity || 0,
        };
        break;
      case "OVERWATCH2":
        transformedData = {
          ...baseData,
          sensitivity: gameSpecificSettings.sensitivity || 0,
          scopedSensitivity: gameSpecificSettings.scopedSensitivity || 0,
          aimAssist: gameSpecificSettings.aimAssist || "50%",
        };
        break;
      default:
        transformedData = {
          ...baseData,
          sensitivity: 0,
        };
    }

    return c.json({
      ok: true,
      data: transformedData,
    });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//コメントを取得する
app.get("/settings/:id/comments", async (c) => {
  try {
    const db = getDatabase();

    const idParam = c.req.param("id");
    const settingId = Number(idParam);

    if (isNaN(settingId)) {
      return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    }

    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.settingId, settingId))
      .orderBy(desc(comments.createdAt))
      .all();

    const transformedComments = result.map((comment: Comment) => ({
      id: comment.id,
      settingId: comment.settingId,
      content: comment.content,
      author: comment.author || "匿名ユーザー",
      createdAt: comment.createdAt
        ? new Date(comment.createdAt).toLocaleDateString("ja-JP")
        : "",
    }));

    return c.json({
      ok: true,
      comments: transformedComments,
    });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

//いいね数を取得
app.get("/settings/:id/likes/count", async (c) => {
  try {
    const db = getDatabase();
    const idParam = c.req.param("id");
    const settingId = Number(idParam);

    if (isNaN(settingId)) {
      return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    }
    const result = await db
      .select()
      .from(likes)
      .where(eq(likes.settingId, settingId))
      .all();

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
      500
    );
  }
});

// コメント作成
app.post("/settings/:id/comments", async (c) => {
  try {
    const db = getDatabase();

    const idParam = c.req.param("id");
    const settingId = Number(idParam);

    if (isNaN(settingId)) {
      return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    }

    const body = await c.req.json();

    // 基本的なバリデーション（zodの代わり）
    if (
      !body.content ||
      typeof body.content !== "string" ||
      body.content.trim().length === 0
    ) {
      return c.json(
        {
          ok: false,
          error: "コメント内容は必須です",
        },
        400
      );
    }

    // データベースに挿入
    const result = await db
      .insert(comments)
      .values({
        settingId: settingId,
        content: body.content.trim(),
        author: body.author || null,
      })
      .returning();

    // 挿入されたデータを取得
    const insertedComment = result[0];
    const transformedComment = {
      id: insertedComment.id,
      settingId: insertedComment.settingId,
      content: insertedComment.content,
      author: insertedComment.author || "匿名ユーザー",
      createdAt: insertedComment.createdAt
        ? new Date(insertedComment.createdAt).toLocaleDateString("ja-JP")
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

// いいねを追加/削除する
app.post("/settings/:id/likes", async (c) => {
  try {
    const db = getDatabase();
    const idParam = c.req.param("id");
    const settingId = Number(idParam);

    if (isNaN(settingId)) {
      return c.json({ ok: false, error: "Invalid setting ID format" }, 400);
    }

    const body = await c.req.json();
    const userIdentifier = body.userIdentifier;

    if (!userIdentifier) {
      return c.json(
        {
          ok: false,
          error: "userIdentifier is required",
        },
        400
      );
    }

    //既存のいいねをチェック
    const existingLike = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.settingId, settingId),
          eq(likes.userIdentifier, userIdentifier)
        )
      )
      .get();

    if (existingLike) {
      await db
        .delete(likes)
        .where(
          and(
            eq(likes.settingId, settingId),
            eq(likes.userIdentifier, userIdentifier)
          )
        );
      return c.json({
        ok: true,
        message: "Like removed successfully",
      });
    } else {
      // いいねを追加
      await db.insert(likes).values({
        settingId: settingId,
        userIdentifier: userIdentifier,
      });

      return c.json({
        ok: true,
        message: "Like added successfully",
      });
    }
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
    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .get();

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
      500
    );
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
