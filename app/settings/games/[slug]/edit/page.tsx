import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getGameBySlug } from "@/constants/games";
import { getUserGameProfile } from "@/lib/services/server/userGames";
import { GameProfileForm } from "@/components/games/GameProfileForm";
import { deleteUserGameProfileAction, updateUserGameProfileAction } from "@/app/(actions)/user-games";

export default async function EditGameProfilePage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const game = getGameBySlug(params.slug);
  if (!game) return notFound();

  const profile = await getUserGameProfile(session.user.id, params.slug);
  if (!profile) redirect(`/settings/games/${params.slug}/create`);

  async function onSave(formData: FormData) {
    'use server';
    return await updateUserGameProfileAction(params.slug, formData);
  }

  async function onDelete() {
    'use server';
    return await deleteUserGameProfileAction(params.slug);
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Edit {game.nameEn} Profile</h1>
      <GameProfileForm
        mode="edit"
        slug={params.slug}
        initial={{
          rank: profile.rank ?? undefined,
          mainRole: profile.mainRole ?? undefined,
          mainCharacter: profile.mainCharacter ?? undefined,
          platform: profile.platform ?? undefined,
          region: profile.region ?? undefined,
          ingameId: profile.ingameId ?? undefined,
          notes: profile.notes ?? undefined,
        }}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}

