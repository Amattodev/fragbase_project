import NextAuth from "next-auth"
// import { DrizzleAdapter } from "@auth/drizzle-adapter"
// import { getDatabase } from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Cloudflare環境でのビルドエラーを回避するため一時的にアダプターを無効化
  // adapter: DrizzleAdapter(getDatabase()),
  session: { strategy: "jwt" },
  ...authConfig,
})