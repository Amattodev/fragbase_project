import { drizzle } from "drizzle-orm/d1";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema";

export function getDatabase() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Use Cloudflare context if already available (runtime). Avoid importing getCloudflareContext here
    // because calling it at route-definition time breaks the build in OpenNext.
    const ctx = (globalThis as any)[Symbol.for("__cloudflare_context__")];
    const d1 = (ctx?.env as any)?.DB as unknown as D1Database | undefined;
    if (d1) {
      return drizzle(d1, { schema });
    }
    // Fallback: create a proxy that resolves the real D1 binding lazily at call time.
    // This keeps build/import time safe; methods will bind to env.DB when actually invoked.
    const lazyD1 = new Proxy(
      {},
      {
        get(_target, prop) {
          const ctx2 = (globalThis as any)[Symbol.for("__cloudflare_context__")];
          const real = (ctx2?.env as any)?.DB;
          if (!real) {
            throw new Error("Cloudflare D1 binding is not available in this context");
          }
          const value = (real as any)[prop];
          return typeof value === "function" ? value.bind(real) : value;
        },
      },
    ) as unknown as D1Database;
    return drizzle(lazyD1, { schema });
  }

  // Development: use local SQLite database
  const sqlite = new Database("./dev.db");
  return drizzleBetterSqlite(sqlite, { schema });
}
