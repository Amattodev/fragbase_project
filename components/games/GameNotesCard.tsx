import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GameNotesCard({ notes }: { notes?: string | null }) {
  const hasNotes = Boolean(notes && notes.trim().length);
  return (
    <Card className={!hasNotes ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">フリーコメント</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {hasNotes ? (
          <p className="whitespace-pre-line leading-relaxed">{notes!.trim()}</p>
        ) : (
          <div className="text-muted-foreground">未設定</div>
        )}
      </CardContent>
    </Card>
  );
}
