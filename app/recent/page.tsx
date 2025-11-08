import Link from "next/link";

export default function RecentPlaceholderPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Recent</h1>
      <p className="mb-6 text-sm text-gray-400">最新の公開記事一覧（準備中）</p>

      <div className="rounded-lg border border-gray-700 bg-[var(--color-surface)] p-6">
        <p className="mb-4 text-gray-300">このページは近日公開予定です。まずはホーム画面から概要をご確認ください。</p>
        <Link href="/" className="text-[var(--color-accent)] underline">
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}

