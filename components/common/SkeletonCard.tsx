import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SkeletonCard({ title }: { title: string }) {
  return (
    <Card className="opacity-70">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

