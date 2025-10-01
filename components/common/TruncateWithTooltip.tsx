import { cn } from "@/lib/utils";

export function TruncateWithTooltip({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const text = typeof children === 'string' ? children : title;
  return (
    <span className={cn("block truncate", className)} title={text ?? undefined}>
      {children}
    </span>
  );
}

