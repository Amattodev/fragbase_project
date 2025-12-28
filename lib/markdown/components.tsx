"use client";

import type { ReactNode } from "react";

// 埋め込みコンテンツをパースしてレンダリング
function renderEmbed(text: string): ReactNode | null {
  // YouTube
  const youtubeMatch = text.match(/\[youtube:([^\]]+)\]/);
  if (youtubeMatch) {
    const content = youtubeMatch[1];

    // チャンネルの場合はカード表示
    if (content.startsWith("channel:")) {
      const channelId = content.replace("channel:", "");
      const channelUrl = `https://youtube.com/channel/${channelId}`;

      return (
        <div className="my-6">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-600 bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="flex-grow">
                <div className="mb-1 text-sm text-gray-400">YouTubeチャンネル</div>
                <div className="font-medium text-[var(--color-text)]">{channelId}</div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      );
    }

    // 動画埋め込み処理
    let embedUrl = "";
    let height = 315;

    if (content.startsWith("video:")) {
      const videoId = content.replace("video:", "");
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (content.startsWith("live:")) {
      const videoId = content.replace("live:", "");
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (content.startsWith("shorts:")) {
      const videoId = content.replace("shorts:", "");
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      height = 560;
    } else {
      // 後方互換性
      embedUrl = `https://www.youtube.com/embed/${content}`;
    }

    return (
      <div className="my-6">
        <iframe
          width="100%"
          height={height}
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg shadow-lg"
        />
      </div>
    );
  }

  // Twitch
  const twitchMatch = text.match(/\[twitch:([^\]]+)\]/);
  if (twitchMatch) {
    const content = twitchMatch[1];

    // チャンネルの場合はカード表示
    if (content.startsWith("channel:")) {
      const channelName = content.replace("channel:", "");
      const channelUrl = `https://twitch.tv/${channelName}`;

      return (
        <div className="my-6">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-600 bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#9146FF">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
              </div>
              <div className="flex-grow">
                <div className="mb-1 text-sm text-gray-400">Twitchチャンネル</div>
                <div className="font-medium text-[var(--color-text)]">{channelName}</div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      );
    }

    // 動画埋め込み処理
    const parentDomain = typeof window !== "undefined" ? window.location.hostname : "localhost";
    let embedUrl = "";

    if (content.startsWith("clip:")) {
      const clipId = content.replace("clip:", "");
      embedUrl = `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parentDomain}`;
    } else if (content.startsWith("video:")) {
      const videoId = content.replace("video:", "");
      embedUrl = `https://player.twitch.tv/?video=${videoId}&parent=${parentDomain}`;
    } else {
      // 後方互換性
      const isClip = !content.match(/^[0-9]+$/);
      embedUrl = isClip
        ? `https://clips.twitch.tv/embed?clip=${content}&parent=${parentDomain}`
        : `https://player.twitch.tv/?video=${content}&parent=${parentDomain}`;
    }

    return (
      <div className="my-6">
        <iframe
          width="100%"
          height="315"
          src={embedUrl}
          frameBorder="0"
          allowFullScreen
          className="rounded-lg shadow-lg"
        />
      </div>
    );
  }

  // TikTok
  const tiktokMatch = text.match(/\[tiktok:([^\]]+)\]/);
  if (tiktokMatch) {
    const content = tiktokMatch[1];

    // チャンネル（ユーザー）の場合はカード表示
    if (content.startsWith("channel:")) {
      const username = content.replace("channel:", "");
      const channelUrl = `https://tiktok.com/@${username}`;

      return (
        <div className="my-6">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-600 bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#000000">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </div>
              <div className="flex-grow">
                <div className="mb-1 text-sm text-gray-400">TikTokアカウント</div>
                <div className="font-medium text-[var(--color-text)]">@{username}</div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      );
    }

    // 動画埋め込み処理
    const videoId = content.startsWith("video:") ? content.replace("video:", "") : content;

    return (
      <div className="my-6">
        <iframe
          width="100%"
          height="600"
          src={`https://www.tiktok.com/embed/${videoId}`}
          frameBorder="0"
          allowFullScreen
          className="rounded-lg shadow-lg"
        />
      </div>
    );
  }

  // X (Twitter)
  const xMatch = text.match(/\[x:([^\]]+)\]/);
  if (xMatch) {
    const content = xMatch[1];

    // アカウントの場合はカード表示
    if (content.startsWith("account:")) {
      const username = content.replace("account:", "");
      const accountUrl = `https://x.com/${username}`;

      return (
        <div className="my-6">
          <a
            href={accountUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-600 bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="flex-grow">
                <div className="mb-1 text-sm text-gray-400">Xアカウント</div>
                <div className="font-medium text-[var(--color-text)]">@{username}</div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      );
    }

    // 投稿の場合はカード表示
    if (content.startsWith("post:")) {
      const postId = content.replace("post:", "");
      const postUrl = `https://x.com/i/web/status/${postId}`;

      return (
        <div className="my-6">
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-600 bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="flex-grow">
                <div className="mb-1 text-sm text-gray-400">Xの投稿</div>
                <div className="text-sm font-medium text-[var(--color-text)]">投稿を表示</div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      );
    }
  }

  return null;
}

// 共通のMarkdownカスタムコンポーネント
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const markdownComponents: Record<string, any> = {
  h1: ({ children }: { children: ReactNode }) => (
    <h1 className="mb-4 mt-8 border-b border-gray-600 pb-2 text-2xl font-bold text-[var(--color-text)]">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: ReactNode }) => (
    <h2 className="mb-3 mt-6 text-xl font-semibold text-[var(--color-text)]">{children}</h2>
  ),
  h3: ({ children }: { children: ReactNode }) => (
    <h3 className="mb-2 mt-4 text-lg font-medium text-[var(--color-text)]">{children}</h3>
  ),
  p: ({ children }: { children: ReactNode }) => {
    // テキスト内容を取得
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children
              .map((child) => (typeof child === "string" ? child : ""))
              .join("")
          : "";

    // 埋め込みコンテンツをチェック
    const embedResult = renderEmbed(text);
    if (embedResult) {
      return <>{embedResult}</>;
    }

    return <p className="mb-4 leading-relaxed text-[var(--color-subtle-text)]">{children}</p>;
  },
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 text-[var(--color-subtle-text)]">{children}</ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 text-[var(--color-subtle-text)]">{children}</ol>
  ),
  li: ({ children }: { children: ReactNode }) => <li className="text-[var(--color-subtle-text)]">{children}</li>,
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="my-4 border-l-4 border-gray-500 pl-4 italic text-gray-400">
      {children}
    </blockquote>
  ),
  code: ({ className, children }: { className?: string; children: ReactNode }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-sm text-[var(--color-accent)]">
          {children}
        </code>
      );
    }
    return (
      <code className={`${className} block`}>{children}</code>
    );
  },
  pre: ({ children }: { children: ReactNode }) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-[var(--color-surface)] p-4 font-mono text-sm">
      {children}
    </pre>
  ),
  a: ({ href, children }: { href?: string; children: ReactNode }) => (
    <a
      href={href}
      className="text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    // 動画ファイルかどうかをチェック（より包括的）
    const isVideo =
      src &&
      typeof src === "string" &&
      (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src) ||
        src.includes("/videos/") ||
        /video/i.test(alt || ""));

    if (isVideo) {
      return (
        <span className="my-4 block">
          <video
            src={src}
            className="h-auto max-w-full rounded-lg"
            controls
            preload="metadata"
            playsInline
          >
            <p>お使いのブラウザは動画タグをサポートしていません。</p>
            {alt && <p>{alt}</p>}
          </video>
        </span>
      );
    }

    return <img src={src} alt={alt} className="my-4 h-auto max-w-full rounded-lg" />;
  },
  table: ({ children }: { children: ReactNode }) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border border-gray-600">{children}</table>
    </div>
  ),
  th: ({ children }: { children: ReactNode }) => (
    <th className="border border-gray-600 bg-[var(--color-surface)] px-4 py-2 font-semibold text-[var(--color-text)]">
      {children}
    </th>
  ),
  td: ({ children }: { children: ReactNode }) => (
    <td className="border border-gray-600 px-4 py-2 text-[var(--color-subtle-text)]">
      {children}
    </td>
  ),
};
