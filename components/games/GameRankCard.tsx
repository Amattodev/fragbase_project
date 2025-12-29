import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartImage } from "@/components/common/SmartImage";
import {
  buildRankBadgePath,
  OVERWATCH_ROLES,
  parseOverwatchRoleRanks,
} from "@/constants/gameAssets";

export function GameRankCard({
  slug,
  currentRank,
  highestRank,
}: {
  slug: string;
  currentRank?: string | null;
  highestRank?: string | null;
}) {
  // Overwatch 2 uses role-based ranks stored as JSON
  if (slug === "overwatch-2") {
    return (
      <OverwatchRankCard currentRank={currentRank} highestRank={highestRank} />
    );
  }

  const has = Boolean(currentRank || highestRank);
  return (
    <Card className={!has ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">Rank</CardTitle>
      </CardHeader>
      <CardContent>
        {has ? (
          <div className="flex items-center justify-center gap-4">
            {currentRank ? (
              <RankBadge slug={slug} rank={currentRank} label="Current" />
            ) : null}
            {highestRank ? (
              <RankBadge slug={slug} rank={highestRank} label="Best" />
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Not set</div>
        )}
      </CardContent>
    </Card>
  );
}

function OverwatchRankCard({
  currentRank,
  highestRank,
}: {
  currentRank?: string | null;
  highestRank?: string | null;
}) {
  const currentRanks = parseOverwatchRoleRanks(currentRank);
  const highestRanks = parseOverwatchRoleRanks(highestRank);
  const hasAny = OVERWATCH_ROLES.some(
    (r) => currentRanks[r.key] || highestRanks[r.key]
  );

  return (
    <Card className={!hasAny ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">Rank (by Role)</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <div className="space-y-3">
            {OVERWATCH_ROLES.map((role) => {
              const current = currentRanks[role.key];
              const highest = highestRanks[role.key];
              if (!current && !highest) return null;
              return (
                <div key={role.key} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{role.label}</p>
                  <div className="flex items-center justify-center gap-3">
                    {current ? (
                      <RankBadge slug="overwatch-2" rank={current} label="Current" />
                    ) : null}
                    {highest ? (
                      <RankBadge slug="overwatch-2" rank={highest} label="Best" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Not set</div>
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
