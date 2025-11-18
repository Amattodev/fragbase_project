"use client";
import { useMemo, useState } from "react";

export type GameIconImageProps = {
  slug: string;
  name: string;
  size?: number; // diameter in px
  active?: boolean;
  className?: string;
};

export default function GameIconImage({ slug, name, size = 56, active = false, className }: GameIconImageProps) {
  const [src, setSrc] = useState(`/games/${slug}.svg`);
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => abbr(name, slug), [name, slug]);
  const bg = useMemo(() => hashColor(slug), [slug]);

  const onError = () => {
    if (src.endsWith(`${slug}.svg`)) setSrc(`/games/${slug}.png`);
    else if (src.endsWith(`${slug}.png`)) setSrc(`/games/${slug}.jpg`);
    else setFailed(true);
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${
        active ? "ring-2 ring-success shadow-[0_0_12px_rgba(123,255,74,0.45)]" : ""
      } ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {failed ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: bg }}
          title={name}
        >
          <span className="text-sm font-semibold text-white select-none">{initials}</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={onError}
        />
      )}
    </div>
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
