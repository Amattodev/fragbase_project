import Link from "next/link";

export type PlayerLite = { username: string; name?: string | null; image?: string | null };

export function GamePlayersStrip({ slug, players }: { slug: string; players: PlayerLite[] }) {
  return (
    <section aria-label="このゲームをプレイしているユーザー" className="mt-4">
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">このゲームをプレイしているユーザー</h3>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">ユーザーが見つかりません</p>
      ) : (
        <ul className="flex items-start gap-4 overflow-x-auto py-1">
          {players.map((u) => (
            <li key={u.username} className="shrink-0">
              <Link
                href={`/profile/${u.username}/games/${slug}`}
                className="flex flex-col items-center gap-1 rounded-md p-1 hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-colors"
                aria-label={`${u.name ?? u.username}（@${u.username}）`}
              >
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.image}
                    alt={u.name ?? u.username}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                    {(u.name ?? u.username).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[64px] truncate text-xs text-muted-foreground">
                  {u.name ?? u.username}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

