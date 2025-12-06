import { SmartImage } from "@/components/common/SmartImage";
import { buildRankBadgePath, type GameRankDef } from "@/constants/gameAssets";
import { cn } from "@/lib/utils";

type RankGridProps = {
  ranks: GameRankDef[];
  selected: string;
  onSelect: (value: string) => void;
  name: string;
  slug: string;
};

export function RankGrid({ ranks, selected, onSelect, name, slug }: RankGridProps) {
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {ranks.map((rank) => {
          const isSelected = selected === rank.value;
          return (
            <button
              key={rank.value}
              type="button"
              onClick={() => onSelect(rank.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors",
                isSelected
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/60",
              )}
            >
              <SmartImage
                src={buildRankBadgePath(slug, rank.value)}
                alt={rank.label}
                className={cn("h-10 w-10", !isSelected && "grayscale opacity-60")}
                imgClassName="h-10 w-10 rounded object-cover"
                fallback={
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                    {rank.label}
                  </span>
                }
              />
              <span className="text-center">{rank.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

