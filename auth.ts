import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDatabase } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/db/schema"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDatabase(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  } as any),
  session: { strategy: "jwt" },
  ...authConfig,
})
