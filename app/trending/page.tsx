import Link from "next/link";

import TopNavTabs from "@/app/_components/TopNavTabs";

export default function TrendingPlaceholderPage() {
  return (
    <>
      <TopNavTabs active="home" />
      <main className="mx-auto max-w-6xl p-4">
        <h1 className="mb-2 text-2xl font-semibold">Trending</h1>
        <p className="mb-6 text-sm text-gray-400">公開から7日以内の記事のハイライト（準備中）</p>

        <div className="rounded-lg border border-gray-700 bg-[var(--color-surface)] p-6">
          <p className="mb-4 text-gray-300">
            このページは近日公開予定です。まずはホーム画面から概要をご確認ください。
          </p>
          <Link href="/" className="text-[var(--color-accent)] underline">
            ホームに戻る
          </Link>
        </div>
      </main>
    </>
  );
}
