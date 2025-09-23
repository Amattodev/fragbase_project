"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";
import { SmartImage } from "@/components/common/SmartImage";
import { useEffect, useMemo, useState } from "react";
import { buildCharacterAvatarPath, buildRoleIconPath, CharacterMetaMap, slugify } from "@/constants/gameAssets";

export function GameMainCharactersCard({ slug, mainCharacters }: { slug: string; mainCharacters?: string[] | null }) {
  const list = (mainCharacters || []).filter((x) => x && x.trim().length > 0).slice(0, 3);
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
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const items = useMemo(() => {
    return list.map((name) => {
      const key = slugify(name);
      const m = meta?.[key];
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
          <ol className="space-y-3 text-sm">
            {items.map((it, idx) => (
              <li key={idx} className="grid grid-cols-[24px_36px_20px_auto_1fr] items-center gap-3 min-h-10">
                <span aria-label={`順位 ${idx + 1}`} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                  {idx + 1}
                </span>
                <SmartImage
                  src={it.avatar}
                  alt={`${it.name} avatar`}
                  className="h-9 w-9"
                  imgClassName="h-9 w-9 rounded object-cover"
                  fallback={<span className="inline-flex h-9 w-9 items-center justify-center rounded bg-muted text-xs text-muted-foreground">{initial(it.name)}</span>}
                />
                <SmartImage
                  src={it.roleIcon}
                  alt={`${it.roleName ?? "role"} icon`}
                  className="h-5 w-5"
                  imgClassName="h-5 w-5 object-contain"
                  fallback={<span className="inline-block h-5 w-5 rounded bg-muted" />}
                />
                <span className="text-muted-foreground">
                  {it.roleName ? <TruncateWithTooltip className="max-w-[140px]">{it.roleName}</TruncateWithTooltip> : <span className="text-muted-foreground">—</span>}
                </span>
                <TruncateWithTooltip className="max-w-[420px] font-medium">{it.name}</TruncateWithTooltip>
              </li>
            ))}
          </ol>
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
