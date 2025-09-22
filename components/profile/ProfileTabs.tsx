"use client";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";

export type GameTab = { slug: string; nameEn: string };

export function ProfileTabs({ username, gameTabs }: { username: string; gameTabs?: GameTab[] }) {
  const segs = useSelectedLayoutSegments();
  const base = `/profile/${username}`;
  const isLikes = segs[2] === 'likes';
  const isGame = segs[2] === 'games';
  const currentGameSlug = isGame ? (segs[3] || '') : '';
  return (
    <nav className="border-b mb-6 overflow-x-auto">
      <ul className="flex gap-6 text-sm whitespace-nowrap">
        <li>
          <Link className={`inline-block py-3 ${!isLikes && !isGame ? "font-semibold border-b-2" : "text-muted-foreground"}`} href={base}>
            Articles
          </Link>
        </li>
        <li>
          <Link className={`inline-block py-3 ${isLikes ? "font-semibold border-b-2" : "text-muted-foreground"}`} href={`${base}/likes`}>
            Likes
          </Link>
        </li>
        {gameTabs?.map((g) => (
          <li key={g.slug}>
            <Link className={`inline-block py-3 ${isGame && currentGameSlug === g.slug ? "font-semibold border-b-2" : "text-muted-foreground"}`} href={`${base}/games/${g.slug}`}>
              {g.nameEn}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
