"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type GameTab = { slug: string; nameEn: string };

export function ProfileTabs({ username, gameTabs }: { username: string; gameTabs?: GameTab[] }) {
  const pathname = usePathname();
  const base = `/profile/${username}`;
  const likesPath = `${base}/likes`;
  const gamesBasePath = `${base}/games`;

  const isLikes = pathname === likesPath;
  const isGameRoot = pathname === gamesBasePath;
  const isGameSlug = pathname.startsWith(`${gamesBasePath}/`);
  const isGame = isGameRoot || isGameSlug;
  const currentGameSlug = isGameSlug ? pathname.replace(`${gamesBasePath}/`, "").split("/")[0] : "";

  const baseItemClass = "-mb-px border-b-2 px-2 pb-2 text-sm transition-colors whitespace-nowrap";
  const inactiveClass = "border-transparent text-muted-foreground hover:border-border hover:text-foreground";
  const activeClass = "border-success font-semibold text-success";

  return (
    <div className="mb-6 w-full border-b border-border">
      <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto">
        <Link
          href={base}
          className={`${baseItemClass} ${!isLikes && !isGame ? activeClass : inactiveClass}`}
          aria-current={!isLikes && !isGame ? "page" : undefined}
        >
          Articles
        </Link>
        <Link
          href={likesPath}
          className={`${baseItemClass} ${isLikes ? activeClass : inactiveClass}`}
          aria-current={isLikes ? "page" : undefined}
        >
          Likes
        </Link>
        {gameTabs?.map((g) => (
          <Link
            key={g.slug}
            href={`${gamesBasePath}/${g.slug}`}
            className={`${baseItemClass} ${
              isGame && currentGameSlug === g.slug ? activeClass : inactiveClass
            }`}
            aria-current={isGame && currentGameSlug === g.slug ? "page" : undefined}
          >
            {g.nameEn}
          </Link>
        ))}
      </nav>
    </div>
  );
}
