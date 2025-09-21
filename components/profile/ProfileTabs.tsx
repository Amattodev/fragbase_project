"use client";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";

export function ProfileTabs({ username }: { username: string }) {
  const segs = useSelectedLayoutSegments();
  const current = segs[2] || ""; // /profile/[username]/(here)
  const base = `/profile/${username}`;
  const tabs = [
    { key: "", label: "Articles", href: base },
    { key: "likes", label: "Likes", href: `${base}/likes` },
    { key: "games", label: "Games", href: `${base}/games` },
  ];
  return (
    <nav className="border-b mb-6">
      <ul className="flex gap-6 text-sm">
        {tabs.map((t) => (
          <li key={t.key}>
            <Link className={`inline-block py-3 ${current === t.key ? "font-semibold border-b-2" : "text-muted-foreground"}`} href={t.href}>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
