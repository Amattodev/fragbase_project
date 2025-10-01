"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  className,
  label = "IDをコピー",
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      aria-label={label}
      onClick={onCopy}
      title={label}
    >
      {copied ? (
        <span className="text-emerald-600">Copied</span>
      ) : (
        <span className="text-muted-foreground">Copy</span>
      )}
    </Button>
  );
}

