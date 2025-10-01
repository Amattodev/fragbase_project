import Link from "next/link";

export type PlayerLite = { username: string; name?: string | null; image?: string | null };

export function GamePlayersStrip({ slug, players }: { slug: string; players: PlayerLite[] }) {
  return (
    <section aria-label="このゲームをプレイしているユーザー" className="mt-4">
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">このゲームをプレイしているユーザー</h3>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">ユーザーが見つかりません</p>
      ) : (
        <ul className="flex items-center gap-2 overflow-x-auto py-1">
          {players.map((u) => (
            <li key={u.username} className="shrink-0">
              <Link
                href={`/profile/${u.username}/games/${slug}`}
                className="block rounded-full focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                aria-label={`${u.name ?? u.username}（@${u.username}）`}
                title={`${u.name ?? u.username} @${u.username}`}
              >
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.image}
                    alt={u.name ?? u.username}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />)
                : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                    {(u.name ?? u.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

