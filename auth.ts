import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { getDatabase } from "@/lib/server/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDatabase(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  } as any),
  session: { strategy: "jwt" },
  ...authConfig,
});
