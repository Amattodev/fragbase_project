'use client';

import Link from "next/link";

type TopNavActive = "home" | "timeline" | "ranking" | "explore";

type TopNavTabsProps = {
  active: TopNavActive;
};

export default function TopNavTabs({ active }: TopNavTabsProps) {
  const baseItemClass =
    "-mb-px border-b-2 px-2 pb-2 text-sm transition-colors";
  const inactiveClass =
    "border-transparent text-muted-foreground hover:border-border hover:text-foreground";
  const activeClass = "border-success font-semibold text-success";

  return (
    <div className="mb-6 w-full border-b border-border">
      <div className="mx-auto flex max-w-6xl gap-4">
        <Link
          href="/"
          className={`${baseItemClass} ${
            active === "home" ? activeClass : inactiveClass
          }`}
        >
          Home
        </Link>
        <Link
          href="/timeline"
          className={`${baseItemClass} ${
            active === "timeline" ? activeClass : inactiveClass
          }`}
        >
          Timeline
        </Link>
        <Link
          href="/rankings"
          className={`${baseItemClass} ${
            active === "ranking" ? activeClass : inactiveClass
          }`}
        >
          Ranking
        </Link>
        <Link
          href="/explore"
          className={`${baseItemClass} ${
            active === "explore" ? activeClass : inactiveClass
          }`}
        >
          Explore
        </Link>
      </div>
    </div>
  );
}
