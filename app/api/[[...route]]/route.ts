import { Hono } from "hono"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import { settings } from "@/db/schema"
import { handle } from "hono/vercel"

const app = new Hono().basePath("/api")

app.get("/settings", async (c) => {
    const db = drizzle(
        (getCloudflareContext().env as any).DB as unknown as D1Database
    );
    const response = await db.select().from(settings);
    return c.json(response);
})

export const GET = handle(app);
