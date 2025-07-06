import { Hono } from "hono"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import { eq, and, desc } from "drizzle-orm"
import type { InferSelectModel } from 'drizzle-orm'
import { settings, comments } from "@/db/schema"
import { handle } from "hono/vercel"
import { getRoleLabel } from '@/constants/role'
import { getFpsExperienceLabel } from '@/constants/fpsExperience'
import { getDpiLabel } from '@/constants/dpi'
import { getDeviceLabel } from '@/constants/device'


const app = new Hono().basePath("/api")

type Setting = InferSelectModel<typeof settings>
type Comment = InferSelectModel<typeof comments>

type GameSpecificSettings = {
    sensitivity?: number
    aimSensitivity?: number
    reactcurve?: string
    deadZone?: string
    scopedSensitivity?: number
    aimAssist?: string
    [key: string]: any
}


// 日本語ラベルを英語キーにマッピングする
const mapLabelToKey = (game: string, label: string): string => {
    const labelMappings: { [game: string]: { [label: string]: string } } = {
        'APEX': {
            '視点感度': 'sensitivity',
            '視点感度（エイム時）': 'aimSensitivity',
            '反応曲線': 'reactcurve',
            'デッドゾーン': 'deadZone',
        },
        'VALORANT': {
            '感度': 'sensitivity',
        },
        'OVERWATCH2': {
            '感度': 'sensitivity',
        }
    }

    return labelMappings[game]?.[label] || label
}

// 設定の全件取得
app.get("/settings", async (c) => {
    try {
        const db = drizzle(
            (getCloudflareContext().env as any).DB as unknown as D1Database
        );

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
        const result = whereConditions.length > 0
            ? await db.select().from(settings).where(
                whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)
            )
                .orderBy(desc(settings.createdAt))
                .limit(limit + 1)
                .offset(offset)
                .all()
            :await db.select().from(settings).orderBy(desc(settings.createdAt)).limit(limit + 1).offset(offset).all();

        const hasMore = result.length > limit;
        const actualData = hasMore ? result.slice(0, limit) : result;

        //データを変換
        const transformedData = actualData.map((setting: Setting) => {
            let gameSpecificSettings: GameSpecificSettings = {}
            try {
                gameSpecificSettings = setting.gameSpecificSettings
                    ? JSON.parse(setting.gameSpecificSettings) as GameSpecificSettings
                    : {}
            } catch (e) {
                console.error('JSON parse error:', e)
            }
            const roleLabel = getRoleLabel(setting.game, setting.role)
            const fpsExperienceLabel = getFpsExperienceLabel(setting.fpsExperience)
            const dpiLabel = getDpiLabel(setting.dpi)
            const deviceLabel = getDeviceLabel(setting.device || "マウス")

            // ゲームタイトルに応じた変換
            const baseData = {
                id: setting.id,
                gameTitle: setting.game,
                role: roleLabel,
                dpi: dpiLabel,
                comment: setting.comment || "",
                createdAt: setting.createdAt ? new Date(setting.createdAt).toISOString().split('T')[0] : "",
                fpsExperience: fpsExperienceLabel,
                character: setting.character || "不明",
                device: deviceLabel,
            }

            // ゲーム固有の設定を追加
            switch (setting.game) {
                case 'APEX':
                    return {
                        ...baseData,
                        sensitivity: gameSpecificSettings.sensitivity || 0,
                        aimSensitivity: gameSpecificSettings.aimSensitivity || 0,
                        reactcurve: gameSpecificSettings.reactcurve || "リニア",
                        deadZone: gameSpecificSettings.deadZone || "なし",
                    }
                case 'VALORANT':
                    return {
                        ...baseData,
                        sensitivity: gameSpecificSettings.sensitivity || 0,
                    }
                case 'OVERWATCH2':
                    return {
                        ...baseData,
                        sensitivity: gameSpecificSettings.sensitivity || 0,
                    }
                default:
                    return {
                        ...baseData,
                        sensitivity: 0,
                    }
            }
        })

        return c.json({
            ok: true,
            data: transformedData,
            pagination: {
                limit,
                offset,
                hasMore,
                currentPage: Math.floor(offset / limit) + 1,
            }
        })
    } catch (error) {
        return c.json({
            ok: false,
            error: (error as Error).message,
        }, 500)
    }

})

// 設定新規作成
app.post("/settings", async (c) => {
    try {
        const db = drizzle(
            (getCloudflareContext().env as any).DB as unknown as D1Database
        )

        const body = await c.req.json()

        // 基本的なバリデーション（zodの代わり）
        if (!body.game || !body.role || typeof body.dpi !== 'number') {
            return c.json({
                ok: false,
                error: 'game, role, dpi are required fields'
            }, 400)
        }

        // 日本語ラベルを英語キーに変換
        const mappedSliders: { [key: string]: any } = {}
        if (body.sliders) {
            Object.entries(body.sliders).forEach(([label, value]) => {
                const key = mapLabelToKey(body.game, label)
                mappedSliders[key] = value
            })
        }

        const mappedSelects: { [key: string]: any } = {}
        if (body.selects) {
            Object.entries(body.selects).forEach(([label, value]) => {
                const key = mapLabelToKey(body.game, label)
                mappedSelects[key] = value
            })
        }

        // ゲーム固有設定をJSON文字列として準備
        const gameSpecificSettings = {
            ...mappedSliders,
            ...mappedSelects,
        }

        const insertData = {
            game: body.game,
            role: body.role,
            dpi: body.dpi,
            comment: body.comment,
            fpsExperience: body.fpsExperience,
            character: body.character,
            device: body.device,
            gameSpecificSettings: JSON.stringify(gameSpecificSettings),
        }

        // DBにデータを挿入する
        const result = await db
            .insert(settings)
            .values(insertData)
            .returning()

        // 成功時に挿入したデータのIDを返す
        return c.json({
            ok: true,
            id: result[0].id,
        })
    } catch (error) {
        return c.json({
            ok: false,
            error: (error as Error).message
        }, 500)
    }
})

//特定の投稿を取得する
app.get("/settings/:id", async (c) => {
    try {
        const db = drizzle(
            (getCloudflareContext().env as any).DB as unknown as D1Database
        )

        const idParam = c.req.param('id')
        const id = Number(idParam)

        if (isNaN(id)) {
            return c.json(
                { ok: false, error: "Invalid ID format" },
                400
            )
        }

        const result = await db
            .select()
            .from(settings)
            .where(eq(settings.id, id))
            .get()

        if (!result) {
            return c.json(
                { ok: false, error: "Setting not found" },
                404
            )
        }

        // ゲーム固有設定をパース
        let gameSpecificSettings: GameSpecificSettings = {}
        try {
            gameSpecificSettings = result.gameSpecificSettings
                ? JSON.parse(result.gameSpecificSettings) as GameSpecificSettings
                : {}
        } catch (e) {
            console.error('JSON parse error:', e)
        }

        const roleLabel = getRoleLabel(result.game, result.role)
        const fpsExperienceLabel = getFpsExperienceLabel(result.fpsExperience)
        const dpiLabel = getDpiLabel(result.dpi)
        const deviceLabel = getDeviceLabel(result.device || "マウス")

        // フロントエンドの型に合わせてデータを変換
        const baseData = {
            id: result.id,
            gameTitle: result.game,
            role: roleLabel,
            dpi: dpiLabel,
            comment: result.comment || "",
            createdAt: result.createdAt ? new Date(result.createdAt).toISOString().split('T')[0] : "",
            fpsExperience: fpsExperienceLabel,
            character: result.character || "不明",
            device: deviceLabel,
        }

        // ゲーム固有の設定を追加
        let transformedData
        switch (result.game) {
            case 'APEX':
                transformedData = {
                    ...baseData,
                    sensitivity: gameSpecificSettings.sensitivity || 0,
                    aimSensitivity: gameSpecificSettings.aimSensitivity || 0,
                    reactcurve: gameSpecificSettings.reactcurve || "リニア",
                    deadZone: gameSpecificSettings.deadZone || "なし",
                }
                break
            case 'VALORANT':
                transformedData = {
                    ...baseData,
                    sensitivity: gameSpecificSettings.sensitivity || 0,
                }
                break
            case 'OVERWATCH2':
                transformedData = {
                    ...baseData,
                    sensitivity: gameSpecificSettings.sensitivity || 0,
                    scopedSensitivity: gameSpecificSettings.scopedSensitivity || 0,
                    aimAssist: gameSpecificSettings.aimAssist || "50%",
                }
                break
            default:
                transformedData = {
                    ...baseData,
                    sensitivity: 0,
                }
        }

        return c.json({
            ok: true,
            data: transformedData,
        })
    } catch (error) {
        return c.json(
            { ok: false, error: (error as Error).message },
            500
        )
    }
})

//コメントを取得する
app.get("/settings/:id/comments", async (c) => {
    try {
        const db = drizzle(
            (getCloudflareContext().env as any).DB as unknown as D1Database
        )

        const idParam = c.req.param('id')
        const settingId = Number(idParam)

        if (isNaN(settingId)) {
            return c.json(
                { ok: false, error: "Invalid setting ID format" },
                400
            )
        }

        const result = await db
            .select()
            .from(comments)
            .where(eq(comments.settingId, settingId))
            .orderBy(desc(comments.createdAt))
            .all()

        const transformedComments = result.map((comment: Comment) => ({
            id: comment.id,
            settingId: comment.settingId,
            content: comment.content,
            author: comment.author || "匿名ユーザー",
            createdAt: comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('ja-JP') : "",
        }))

        return c.json({
            ok: true,
            comments: transformedComments,
        })
    } catch (error) {
        return c.json(
            { ok: false, error: (error as Error).message },
            500
        )
    }
})

// コメント作成
app.post("/settings/:id/comments", async (c) => {
    try {
        const db = drizzle(
            (getCloudflareContext().env as any).DB as unknown as D1Database
        )

        const idParam = c.req.param('id')
        const settingId = Number(idParam)

        if (isNaN(settingId)) {
            return c.json(
                { ok: false, error: "Invalid setting ID format" },
                400
            )
        }

        const body = await c.req.json()

        // 基本的なバリデーション（zodの代わり）
        if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
            return c.json({
                ok: false,
                error: "コメント内容は必須です"
            }, 400)
        }

        // データベースに挿入
        const result = await db
            .insert(comments)
            .values({
                settingId: settingId,
                content: body.content.trim(),
                author: body.author || null,
            })
            .returning()

        // 挿入されたデータを取得
        const insertedComment = result[0]
        const transformedComment = {
            id: insertedComment.id,
            settingId: insertedComment.settingId,
            content: insertedComment.content,
            author: insertedComment.author || "匿名ユーザー",
            createdAt: insertedComment.createdAt ? new Date(insertedComment.createdAt).toLocaleDateString('ja-JP') : "",
        }

        return c.json({
            ok: true,
            comment: transformedComment,
        })
    } catch (error) {
        return c.json(
            { ok: false, error: (error as Error).message },
            500
        )
    }
})


export const GET = handle(app);
export const POST = handle(app);
