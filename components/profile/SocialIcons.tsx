"use client";
import Link from "next/link";
import { SOCIALS, SOCIAL_ORDER, FALLBACK_SOCIAL_ICON } from "@/types/social";

type Props = { links?: Record<string, string> | null };

export function SocialIcons({ links }: Props) {
  if (!links) return null;
  const entries = Object.entries(links).filter(([, v]) => !!v);
  if (entries.length === 0) return null;

  // 既知の表示順 → その他
  const sorted = [
    ...SOCIAL_ORDER.flatMap((k) => entries.filter(([key]) => key === k)),
    ...entries.filter(([key]) => !SOCIAL_ORDER.includes(key as any)),
  ];

  return (
    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
      {sorted.map(([key, url]) => {
        const meta = SOCIALS[key] as (typeof SOCIALS)[string] | undefined;
        const Icon = meta?.icon ?? FALLBACK_SOCIAL_ICON;
        const label = meta?.label ?? key;
        return (
          <Link
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="inline-flex items-center justify-center h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
