"use client";
import RailIcon from "./RailIcon";

export type RailGame = { slug: string; name: string };

export type GameIconRailProps = {
  games: RailGame[];
  selectedSlug: string;
  visibleCount: number; // 初期20、"もっと見る(ゲーム)"で+20 ずつ増える
  onSelect: (slug: string) => void;
  onShowMore: () => void;
  loading?: boolean;
};

// 横スクロールのゲームアイコンレール（ARIAは後続で精緻化）
export function GameIconRail({
  games,
  selectedSlug,
  visibleCount,
  onSelect,
  onShowMore,
  loading,
}: GameIconRailProps) {
  const visible = games.slice(0, Math.max(0, visibleCount));
  const hasMore = games.length > visible.length;

  return (
    <section aria-label="ゲームレール" className="mb-6">
      <div role="radiogroup" aria-label="ゲームを選択" className="flex items-center gap-3">
        <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 py-2">
          {loading && visible.length === 0 ? (
            <RailSkeleton count={8} />
          ) : (
            visible.map((g) => (
              <RailIcon
                key={g.slug}
                slug={g.slug}
                name={g.name}
                active={g.slug === selectedSlug}
                onClick={() => onSelect(g.slug)}
              />
            ))
          )}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={onShowMore}
            className="shrink-0 rounded-md border px-3 py-2 text-xs hover:bg-[var(--color-surface-hover)]"
            aria-label="さらにゲームを表示"
          >
            もっと見る
          </button>
        )}
      </div>
    </section>
  );
}

function RailSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex w-[72px] flex-col items-center gap-1 p-2">
          <div className="h-14 w-14 animate-pulse rounded-full bg-gray-700/50" />
          <div className="h-3 w-12 animate-pulse rounded bg-gray-700/40" />
        </div>
      ))}
    </div>
  );
}

export default GameIconRail;
