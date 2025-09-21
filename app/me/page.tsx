import { auth } from "@/auth";
import { getDatabase } from "@/lib/server/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const db = getDatabase();
  const me = await db.select().from(users).where(eq(users.id, session.user.id)).get();
  const username = me?.username || "";
  if (!username) {
    return <div className="p-6">ユーザー名を設定してください。</div>;
  }
  redirect(`/profile/${username}`);
}
