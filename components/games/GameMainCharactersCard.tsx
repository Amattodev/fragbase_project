"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";
import { SmartImage } from "@/components/common/SmartImage";
import { useEffect, useMemo, useState } from "react";
import { buildCharacterAvatarPath, CharacterMetaMap, slugify } from "@/constants/gameAssets";

export function GameMainCharactersCard({ slug, mainCharacters }: { slug: string; mainCharacters?: string[] | null }) {
  const list = (mainCharacters || []).filter((x) => x && x.trim().length > 0);
  const hasAny = list.length > 0;

  const [meta, setMeta] = useState<CharacterMetaMap | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/images/games/${slug}/characters.json`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as CharacterMetaMap;
        if (alive) setMeta(data);
      } catch (error) {
        console.error(`Error loading characters.json for ${slug}:`, error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const items = useMemo(() => {
    return list.map((name) => {
      if (!name || name.trim().length === 0) {
        return { name: "Unknown", avatar: "" };
      }

      const key = slugify(name);
      const m = meta?.[name] ?? meta?.[key];

      const avatar = m?.avatar ?? buildCharacterAvatarPath(slug, name);
      return { name, avatar };
    });
  }, [list, meta, slug]);

  return (
    <Card className={!hasAny ? "border-dashed opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm">メインキャラ</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-md border bg-card p-3 text-sm">
                <div className="flex flex-col items-center gap-2">
                  <SmartImage
                    src={it.avatar}
                    alt={`${it.name} avatar`}
                    className="h-16 w-16"
                    imgClassName="h-16 w-16 rounded object-cover"
                    fallback={
                      <span className="inline-flex h-16 w-16 items-center justify-center rounded bg-muted text-sm text-muted-foreground">
                        {initial(it.name)}
                      </span>
                    }
                  />
                  <TruncateWithTooltip className="max-w-full text-center font-medium">{it.name}</TruncateWithTooltip>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">未設定</div>
        )}
      </CardContent>
    </Card>
  );
}

function initial(s: string) {
  return s.trim().charAt(0).toUpperCase() || "?";
}
