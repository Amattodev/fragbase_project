import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GameRankCard({
  currentRank,
  highestRank,
}: {
  currentRank?: string | null;
  highestRank?: string | null;
}) {
  const has = Boolean(currentRank || highestRank);
  const arrow = getTrendArrow(currentRank, highestRank);
  return (
    <Card className={!has ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">Rank</CardTitle>
      </CardHeader>
      <CardContent>
        {has ? (
          <div className="flex items-center gap-2 text-sm">
            {currentRank ? <span>Current: {currentRank}</span> : null}
            {currentRank && highestRank ? <span className="text-muted-foreground">/</span> : null}
            {highestRank ? <span>Best: {highestRank}</span> : null}
            {arrow ? (
              <span aria-hidden className="ml-1 text-muted-foreground">
                {arrow}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">未設定</div>
        )}
      </CardContent>
    </Card>
  );
}

function getTrendArrow(current?: string | null, peak?: string | null): string | null {
  if (!current || !peak) return null;
  if (current === peak) return null;
  // Try numeric comparison if both contain a number
  const n1 = extractFirstNumber(current);
  const n2 = extractFirstNumber(peak);
  if (n1 != null && n2 != null) {
    if (n1 < n2) return "↑";
    return null;
  }
  return null;
}

function extractFirstNumber(s: string): number | null {
  const m = s.match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}
