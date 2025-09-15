import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import Twitch from "next-auth/providers/twitch"
import { getDatabase } from "@/lib/db"
import { users, accounts } from "@/db/schema"
import { and, eq } from "drizzle-orm"

export const authConfig = {
  providers: [
    // テスト用：まずはGoogleのみで動作確認
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    
    // Discord（認証情報設定済みの場合のみ）
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET ? [
      Discord({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      })
    ] : []),
    
    // Twitch（認証情報設定済みの場合のみ）
    ...(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET ? [
      Twitch({
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
      })
    ] : []),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  // Cloudflare環境での信頼されたホスト設定
  trustHost: true,
  // 開発環境でもHTTPを許可（preview環境対応）
  useSecureCookies: false,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (process.env.NODE_ENV !== "production") {
        try {
          const db = getDatabase();
          const mail = (user?.email || (profile as any)?.email || "").toString();
          if (account && mail) {
            const existingUser = await db.select().from(users).where(eq(users.email, mail)).get();
            if (existingUser) {
              const acc = await db
                .select()
                .from(accounts)
                .where(and(eq(accounts.provider, account.provider), eq(accounts.providerAccountId, account.providerAccountId)))
                .get();
              if (!acc) {
                await db.insert(accounts).values({
                  userId: existingUser.id,
                  type: account.type as any,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: (account as any).refresh_token ?? null,
                  access_token: (account as any).access_token ?? null,
                  expires_at: (account as any).expires_at ?? null,
                  token_type: (account as any).token_type ?? null,
                  scope: (account as any).scope ?? null,
                  id_token: (account as any).id_token ?? null,
                  session_state: (account as any).session_state ?? null,
                });
                console.log("[AuthDebug] Linked account to existing user by email", {
                  email: mail,
                  provider: account.provider,
                });
              }
            }
          }
        } catch (e) {
          console.log("[AuthDebug] signIn linking error", e);
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] jwt callback (before)", {
          hasUser: !!user,
          tokenId: (token as any)?.id,
          email: (token as any)?.email,
        });
      }
      if (user) {
        token.id = user.id || crypto.randomUUID();
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] jwt callback (after)", {
          tokenId: (token as any)?.id,
          email: (token as any)?.email,
        });
      }
      return token;
    },
    session({ session, token }) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] session callback (before)", {
          hasSessionUser: !!session.user,
          tokenId: (token as any)?.id,
        });
      }
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] session callback (after)", {
          hasSessionUser: !!session.user,
          sessionUserId: session.user?.id,
        });
      }
      return session;
    },
  },
  events: {
    async signIn(message: any) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] events.signIn", {
          userId: message?.user?.id,
          accountProvider: message?.account?.provider,
        });
      }
    },
    async signOut(message: any) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] events.signOut", !!message?.session);
      }
    },
    async createUser(message: any) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] events.createUser", message?.user?.id);
      }
    },
    async session(message: any) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthDebug] events.session", !!message?.session?.user);
      }
    },
  },
} satisfies NextAuthConfig
