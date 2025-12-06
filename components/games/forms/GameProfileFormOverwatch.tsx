import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SmartImage } from "@/components/common/SmartImage";
import { OVERWATCH_CHARACTERS, OVERWATCH_RANKS } from "@/constants/gameAssets";
import { cn } from "@/lib/utils";
import type { GameProfileFormInnerProps } from "./types";
import { Field } from "./GameProfileFormDefault";
import { RankGrid } from "./GameRankGrid";

type Props = GameProfileFormInnerProps;

export function OverwatchGameProfileForm({ mode, initial, onSave, onDelete }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentRank, setCurrentRank] = useState<string>(() => normalizeOverwatchRank(initial?.currentRank));
  const [highestRank, setHighestRank] = useState<string>(() => normalizeOverwatchRank(initial?.highestRank));
  const [characters, setCharacters] = useState<string[]>(() => initial?.mainCharacters || []);

  function toggleCharacter(value: string) {
    setCharacters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.delete("mainCharacters[]");
    characters.forEach((name) => fd.append("mainCharacters[]", name));
    start(async () => {
      try {
        const res = await onSave(fd);
        window.location.href = res.redirect;
      } catch (err: any) {
        setError(err?.message || "Failed to save");
      }
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this game profile?")) return;
    start(async () => {
      try {
        const res = await onDelete();
        window.location.href = res.redirect;
      } catch (err: any) {
        setError(err?.message || "Failed to delete");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          ランク
          <span className="ml-2 align-middle text-xs text-muted-foreground">(任意)</span>
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">現ランク</p>
            <RankGrid
              ranks={OVERWATCH_RANKS}
              selected={currentRank}
              onSelect={setCurrentRank}
              name="currentRank"
              slug="overwatch-2"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">最高ランク</p>
            <RankGrid
              ranks={OVERWATCH_RANKS}
              selected={highestRank}
              onSelect={setHighestRank}
              name="highestRank"
              slug="overwatch-2"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          メインヒーロー
          <span className="ml-2 align-middle text-xs text-muted-foreground">(任意)</span>
        </h2>
        <input type="hidden" name="dummy-mainCharacters" value="" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {OVERWATCH_CHARACTERS.map((ch) => {
            const selected = characters.includes(ch.value);
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => toggleCharacter(ch.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors",
                  selected
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent/60",
                )}
              >
                <SmartImage
                  src={ch.imagePath}
                  alt={ch.label}
                  className={cn("h-12 w-12", !selected && "grayscale opacity-60")}
                  imgClassName="h-12 w-12 rounded object-cover"
                  fallback={
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-muted text-sm text-muted-foreground">
                      {ch.label.charAt(0)}
                    </span>
                  }
                />
                <span className="text-center">{ch.label}</span>
              </button>
            );
          })}
        </div>
        {characters.map((name) => (
          <input key={name} type="hidden" name="mainCharacters[]" value={name} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          アカウント情報
          <span className="ml-2 align-middle text-xs text-muted-foreground">(任意)</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ゲームアカウントID" name="accountId" defaultValue={initial?.accountId} />
          <Field label="ゲーム内ユーザー名" name="accountUsername" defaultValue={initial?.accountUsername} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          フリーコメント
          <span className="ml-2 align-middle text-xs text-muted-foreground">(任意)</span>
        </h2>
        <Textarea
          name="notes"
          defaultValue={initial?.notes}
          placeholder="得意なロールやよく使う編成などを自由に書けます。"
          className="text-sm"
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Save" : "Save Changes"}
        </Button>
        {mode === "edit" && onDelete && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            Delete Profile
          </Button>
        )}
      </div>
    </form>
  );
}

function normalizeOverwatchRank(raw?: string | null): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const tiers = OVERWATCH_RANKS.map((r) => r.value.toLowerCase());
  const found = tiers.find((t) => lower.includes(t));
  return found ? OVERWATCH_RANKS.find((r) => r.value.toLowerCase() === found)!.value : raw;
}

