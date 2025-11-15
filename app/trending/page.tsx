import Link from "next/link";

export default function TrendingPlaceholderPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* Top Tabs: Trending / Ranking / Explore */}
      <div className="mb-4 flex gap-4 border-b border-gray-200">
        <Link href="/" className="-mb-px border-b-2 border-black px-2 pb-2 text-sm font-medium">
          Trending
        </Link>
        <Link
          href="/rankings"
          className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300"
        >
          Ranking
        </Link>
        <Link
          href="/explore"
          className="-mb-px border-b-2 border-transparent px-2 pb-2 text-sm text-gray-500 hover:border-gray-300"
        >
          Explore
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-semibold">Trending</h1>
      <p className="mb-6 text-sm text-gray-400">公開から7日以内の記事のハイライト（準備中）</p>

      <div className="rounded-lg border border-gray-700 bg-[var(--color-surface)] p-6">
        <p className="mb-4 text-gray-300">このページは近日公開予定です。まずはホーム画面から概要をご確認ください。</p>
        <Link href="/" className="text-[var(--color-accent)] underline">
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}
