import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SmartImage } from "@/components/common/SmartImage";
import { VALORANT_AGENTS, VALORANT_RANKS } from "@/constants/gameAssets";
import { cn } from "@/lib/utils";
import type { GameProfileFormInnerProps } from "./types";
import { Field } from "./GameProfileFormDefault";
import { RankGrid } from "./GameRankGrid";

type Props = GameProfileFormInnerProps;

export function ValorantGameProfileForm({ mode, initial, onSave, onDelete }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentRank, setCurrentRank] = useState<string>(() => normalizeValorantRank(initial?.currentRank));
  const [highestRank, setHighestRank] = useState<string>(() => normalizeValorantRank(initial?.highestRank));
  const [agents, setAgents] = useState<string[]>(() => initial?.mainCharacters || []);

  function toggleAgent(value: string) {
    setAgents((prev) => {
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
    agents.forEach((name) => fd.append("mainCharacters[]", name));
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
            <RankGrid ranks={VALORANT_RANKS} selected={currentRank} onSelect={setCurrentRank} name="currentRank" slug="valorant" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">最高ランク</p>
            <RankGrid
              ranks={VALORANT_RANKS}
              selected={highestRank}
              onSelect={setHighestRank}
              name="highestRank"
              slug="valorant"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          メインエージェント
          <span className="ml-2 align-middle text-xs text-muted-foreground">(任意)</span>
        </h2>
        <input type="hidden" name="dummy-mainCharacters" value="" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {VALORANT_AGENTS.map((agent) => {
            const selected = agents.includes(agent.value);
            return (
              <button
                key={agent.value}
                type="button"
                onClick={() => toggleAgent(agent.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors",
                  selected
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent/60",
                )}
              >
                <SmartImage
                  src={agent.imagePath}
                  alt={agent.label}
                  className={cn("h-12 w-12", !selected && "grayscale opacity-60")}
                  imgClassName="h-12 w-12 rounded object-cover"
                  fallback={
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-muted text-sm text-muted-foreground">
                      {agent.label.charAt(0)}
                    </span>
                  }
                />
                <span className="text-center">{agent.label}</span>
              </button>
            );
          })}
        </div>
        {agents.map((name) => (
          <input key={name} type="hidden" name="mainCharacters[]" value={name} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          アカウント情報
          <span className="ml-2 align-middle text-xs text-muted-foreground">(任意)</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Riot ID" name="accountId" defaultValue={initial?.accountId} placeholder="playername#1234" />
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
          placeholder="得意なマップやプレイスタイル、よく合わせるエージェント構成などを自由に書けます。"
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

function normalizeValorantRank(raw?: string | null): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const tiers = VALORANT_RANKS.map((r) => r.value.toLowerCase());
  const found = tiers.find((t) => lower.startsWith(t));
  return found ? VALORANT_RANKS.find((r) => r.value.toLowerCase() === found)!.value : raw;
}

