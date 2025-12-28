import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartImage } from "@/components/common/SmartImage";
import { buildRankBadgePath } from "@/constants/gameAssets";

export function GameRankCard({
  slug,
  currentRank,
  highestRank,
}: {
  slug: string;
  currentRank?: string | null;
  highestRank?: string | null;
}) {
  const has = Boolean(currentRank || highestRank);
  return (
    <Card className={!has ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">Rank</CardTitle>
      </CardHeader>
      <CardContent>
        {has ? (
          <div className="flex items-center gap-4">
            {currentRank ? (
              <RankBadge slug={slug} rank={currentRank} label="Current" />
            ) : null}
            {highestRank ? (
              <RankBadge slug={slug} rank={highestRank} label="Best" />
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">未設定</div>
        )}
      </CardContent>
    </Card>
  );
}

function RankBadge({ slug, rank, label }: { slug: string; rank: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <SmartImage
        src={buildRankBadgePath(slug, rank)}
        alt={rank}
        className="h-12 w-12"
        imgClassName="h-12 w-12 object-contain"
        fallback={
          <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
            {rank}
          </span>
        }
      />
      <span className="text-xs font-medium">{rank}</span>
    </div>
  );
}
