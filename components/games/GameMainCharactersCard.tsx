import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GameMainCharactersCard({ mainCharacters }: { mainCharacters?: string[] | null }) {
  const list = (mainCharacters || []).filter((x) => x && x.trim().length > 0).slice(0, 3);
  const hasAny = list.length > 0;
  return (
    <Card className={!hasAny ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">Main Character</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <ol className="space-y-2 text-sm">
            {list.map((name, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                  {idx + 1}
                </span>
                <TruncateWithTooltip className="max-w-[480px]">{name}</TruncateWithTooltip>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-sm text-muted-foreground">未設定</div>
        )}
      </CardContent>
    </Card>
  );
}
