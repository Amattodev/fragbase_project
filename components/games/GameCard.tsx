"use client";
import Link from "next/link";
import { useState } from "react";

export function GameCard({
  slug,
  name,
  href,
  added,
}: {
  slug: string;
  name: string;
  href: string;
  added?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const initials = abbr(name, slug);
  const bg = hashColor(slug);
  return (
    <Link href={href} className="group block overflow-hidden rounded-md border hover:shadow-sm focus:outline-none focus:ring-2" aria-label={`${name}${added ? ' (Added)' : ''}`}>
      <div className="flex items-center gap-4 p-3">
        <div className="h-14 w-14 flex items-center justify-center rounded-md" style={{ backgroundColor: imageError ? bg : undefined }}>
          {imageError ? (
            <span className="text-sm font-semibold text-white">{initials}</span>
          ) : (
            // use public path images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/games/${slug}.svg`}
              alt={name}
              className="h-14 w-14 object-contain"
              onError={(e) => {
                // try png then jpg then fallback letters
                const el = e.currentTarget as HTMLImageElement;
                if (el.src.endsWith(`${slug}.svg`)) {
                  el.src = `/games/${slug}.png`;
                } else if (el.src.endsWith(`${slug}.png`)) {
                  el.src = `/games/${slug}.jpg`;
                } else {
                  setImageError(true);
                }
              }}
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{name}</span>
            {added && (
              <span className="rounded bg-green-600/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">Added</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{added ? 'Edit profile' : 'Create profile'}</span>
        </div>
      </div>
    </Link>
  );
}

function abbr(name: string, slug: string) {
  const map: Record<string, string> = {
    'League of Legends': 'LoL',
    'Overwatch 2': 'OW2',
    'Rainbow Six Siege': 'R6S',
    'Counter-Strike 2': 'CS2',
  };
  if (map[name]) return map[name];
  const words = name.split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name[0] || slug[0] || 'G').toUpperCase();
}

function hashColor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 40%)`;
}

