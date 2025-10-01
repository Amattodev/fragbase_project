import { CopyButton } from "@/components/common/CopyButton";
import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GameAccountCard({
  accountUsername,
  accountId,
}: {
  accountUsername?: string | null;
  accountId?: string | null;
}) {
  const hasUser = Boolean(accountUsername);
  const hasId = Boolean(accountId);
  const hasAny = hasUser || hasId;
  return (
    <Card className={!hasAny ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">Account</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {hasAny ? (
          <div className="space-y-1">
            {hasUser ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Account Name:</span>
                <TruncateWithTooltip className="max-w-[260px]">
                  {accountUsername!}
                </TruncateWithTooltip>
              </div>
            ) : null}
            {hasId ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">ID:</span>
                <TruncateWithTooltip className="max-w-[220px]">{accountId!}</TruncateWithTooltip>
                <CopyButton text={accountId!} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-muted-foreground">未設定</div>
        )}
      </CardContent>
    </Card>
  );
}
