import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDatabase } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/db/schema"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDatabase(), {
    users,
    accounts,
    sessions,
    verificationTokens,
  }),
  session: { strategy: "jwt" },
  ...authConfig,
})
