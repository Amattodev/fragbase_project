"use client";
import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/(actions)/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProfileForm({ initial }: { initial: { name: string; username: string; bio: string | null; socialLinks?: Record<string, string> | null } }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      action={(fd) => {
        start(async () => {
          setError(null);
          try {
            await updateProfileAction(fd);
          } catch (e) {
            const msg = (e as Error)?.message || "";
            if (msg.includes("invalid_username")) {
              setError("ユーザー名は英数字と -/_ のみ、3–20文字で入力してください。");
            } else if (msg.includes("username_taken")) {
              setError("このユーザー名は既に使用されています。");
            } else {
              setError("保存に失敗しました。しばらくしてから再度お試しください。");
            }
          }
        });
      }}
      className="space-y-4 w-full max-w-xl"
    >
      <div>
        <label className="block text-sm mb-1">表示名</label>
        <Input name="name" defaultValue={initial.name} placeholder="表示名" maxLength={50} />
        <p className="mt-1 text-xs text-muted-foreground">1–50文字。日本語や絵文字も利用できます。</p>
      </div>
      <div>
        <label className="block text-sm mb-1">ユーザー名</label>
        <Input name="username" defaultValue={initial.username} placeholder="ユーザー名" required aria-invalid={!!error} />
        <p className="mt-1 text-xs text-muted-foreground">英数字、記号は - と _ のみ、3–20文字（先頭/末尾の -/_ は不可）</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div>
        <label className="block text-sm mb-1">自己紹介</label>
        <Textarea name="bio" defaultValue={initial.bio ?? ""} rows={4} maxLength={280} />
      </div>
      <fieldset className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div><label className="block text-sm mb-1">X</label><Input name="x" defaultValue={initial.socialLinks?.x ?? ""} placeholder="https://x.com/..." /></div>
        <div><label className="block text-sm mb-1">YouTube</label><Input name="youtube" defaultValue={initial.socialLinks?.youtube ?? ""} placeholder="https://youtube.com/..." /></div>
        <div><label className="block text-sm mb-1">Twitch</label><Input name="twitch" defaultValue={initial.socialLinks?.twitch ?? ""} placeholder="https://twitch.tv/..." /></div>
        <div><label className="block text-sm mb-1">Steam</label><Input name="steam" defaultValue={initial.socialLinks?.steam ?? ""} placeholder="https://steamcommunity.com/..." /></div>
        <div><label className="block text-sm mb-1">Discord</label><Input name="discord" defaultValue={initial.socialLinks?.discord ?? ""} placeholder="https://discord.gg/..." /></div>
      </fieldset>
      <Button type="submit" disabled={pending}>{pending ? "更新中..." : "更新"}</Button>
    </form>
  );
}
