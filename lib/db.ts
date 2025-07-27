import { drizzle } from "drizzle-orm/d1";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "@/db/schema";

export function getDatabase() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return drizzle(
      (getCloudflareContext().env as any).DB as unknown as D1Database,
      { schema }
    );
  } else {
    const sqlite = new Database("./dev.db");
    return drizzleBetterSqlite(sqlite, { schema });
  }
}
