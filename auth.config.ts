import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import Twitch from "next-auth/providers/twitch"

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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id || crypto.randomUUID();
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig