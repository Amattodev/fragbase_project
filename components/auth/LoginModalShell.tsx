"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type LoginModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

/**
 * Reusable shell for the auth modal (background overlay + framed card with grid glow).
 * It does NOT include provider logic. Pass your content via children.
 */
export function LoginModalShell({ open, onClose, children, className }: LoginModalShellProps) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-[var(--article-card)] shadow-[0_0_40px_rgba(0,245,255,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,245,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,59,254,0.10),transparent_40%)] opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className={cn("relative space-y-4 px-8 pb-6 pt-6", className)}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-2 rounded-full border border-border/70 p-2 text-muted-foreground transition hover:border-accent hover:bg-card/60 hover:text-accent"
          >
            <X size={16} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
