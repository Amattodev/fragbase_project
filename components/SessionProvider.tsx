"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[AuthDebug] <SessionProvider> mounted");
  }
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
