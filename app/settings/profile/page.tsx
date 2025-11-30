import { auth } from "@/auth";
import { getDatabase } from "@/lib/server/db";
import { userProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileAvatarEditor } from "@/components/profile/ProfileAvatarEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <Card style={{ backgroundColor: "var(--article-card)" }}>
          <CardHeader>
            <CardTitle className="text-xl">プロフィールを編集</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <ProfileAvatarEditor initialImageUrl={u?.image ?? null} />
              <ProfileForm initial={{ name: u?.name ?? "", username: u?.username || "", bio: p?.bio ?? null, socialLinks }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
