import { auth } from "@/auth";
import { getDatabase } from "@/lib/server/db";
import { userProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const db = getDatabase();
  const u = await db.select().from(users).where(eq(users.id, session.user.id)).get();
  const p = await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id)).get();
  let socialLinks: Record<string, string> | null | undefined = undefined;
  try {
    socialLinks = p?.socialLinks ? (JSON.parse(p.socialLinks) as Record<string, string>) : undefined;
  } catch {
    socialLinks = undefined;
  }
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">プロフィールを編集</h1>
      <ProfileForm initial={{ name: u?.name ?? "", username: u?.username || "", bio: p?.bio ?? null, socialLinks }} />
    </div>
  );
}
