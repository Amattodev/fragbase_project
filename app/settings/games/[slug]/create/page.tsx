import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGameBySlug } from "@/constants/games";
import { getUserGameProfile } from "@/lib/services/server/userGames";
import { GameProfileForm } from "@/components/games/GameProfileForm";
import { createUserGameProfileAction } from "@/app/(actions)/user-games";

export default async function CreateGameProfilePage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const game = getGameBySlug(params.slug);
  if (!game) return notFound();

  const exists = await getUserGameProfile(session.user.id, params.slug);
  if (exists) redirect(`/settings/games/${params.slug}/edit`);

  async function onSave(formData: FormData) {
    'use server';
    return await createUserGameProfileAction(params.slug, formData);
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Create {game.nameEn} Profile</h1>
      <GameProfileForm mode="create" slug={params.slug} onSave={onSave} />
    </div>
  );
}

import { notFound } from "next/navigation";
