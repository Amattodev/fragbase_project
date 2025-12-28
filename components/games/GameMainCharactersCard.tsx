"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";
import { SmartImage } from "@/components/common/SmartImage";
import { useEffect, useMemo, useState } from "react";
import { buildCharacterAvatarPath, buildRoleIconPath, CharacterMetaMap, slugify } from "@/constants/gameAssets";

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
        return { name: "Unknown", avatar: "", roleIcon: undefined, roleName: undefined };
      }

      const key = slugify(name);
      const m = meta?.[name] ?? meta?.[key];

      // If we can't find character in metadata and slugify returns empty (Japanese chars),
      // it means this character doesn't belong to this game
      if (!m && key === "") {
        return {
          name,
          avatar: "",
          roleIcon: undefined,
          roleName: "Wrong Game"
        };
      }

      const avatar = m?.avatar ?? buildCharacterAvatarPath(slug, name);
      const roleKey = m?.roleKey;
      const roleIcon = roleKey ? (m?.roleIcon ?? buildRoleIconPath(slug, roleKey)) : undefined;
      const roleName = m?.roleName ?? (roleKey ? titleCase(roleKey) : undefined);
      return { name, avatar, roleIcon, roleName };
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
                  <div className="flex items-center gap-2">
                    {it.roleIcon ? (
                      <SmartImage
                        src={it.roleIcon}
                        alt={`${it.roleName ?? "role"} icon`}
                        className="h-5 w-5"
                        imgClassName="h-5 w-5 object-contain"
                        fallback={<span className="inline-block h-5 w-5 rounded bg-muted" />}
                      />
                    ) : (
                      <span className="inline-block h-5 w-5 rounded bg-muted" />
                    )}
                    <span className="text-muted-foreground">
                      {it.roleName ? <TruncateWithTooltip className="max-w-[120px]">{it.roleName}</TruncateWithTooltip> : "—"}
                    </span>
                  </div>
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

function titleCase(s: string) {
  return s
    .split(/[\s_-]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function initial(s: string) {
  return s.trim().charAt(0).toUpperCase() || "?";
}
