import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

function autoEmbedYouTube(html: string): string {
  // Regular expression to find YouTube links
  const youtubeRegex =
    /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;

  // Replace YouTube links with embedded iframe
  return html.replace(youtubeRegex, (match, videoId) => {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  });
}

export const processVideoEmbeds = (html: string): string => {
  // YouTubeの埋め込み
  html = html.replace(
    /\[youtube:([^\]]+)\]/g,
    (match, videoId) => `
          <div class="video-embed my-6">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/${videoId}"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="rounded-lg shadow-lg"
            ></iframe>
          </div>
        `,
  );

  // ローカル動画の埋め込み（video-*参照リンクを処理）
  // まず参照リンクを収集
  const videoRefs: { [key: string]: string } = {};
  const refRegex = /\[video-(\d+)\]:\s*(.+)$/gm;
  let match;
  while ((match = refRegex.exec(html)) !== null) {
    videoRefs[`video-${match[1]}`] = match[2].trim();
  }

  // 動画参照を実際のvideo要素に置換
  html = html.replace(
    /<img[^>]*alt="([^"]*)"[^>]*>\s*\[video-(\d+)\]/g,
    (match, altText, videoNum) => {
      const videoUrl = videoRefs[`video-${videoNum}`];
      if (videoUrl && (videoUrl.includes("/uploads/videos/") || videoUrl.includes(".r2.dev"))) {
        return `
          <div class="video-embed my-6">
            <video
              width="100%"
              controls
              class="rounded-lg shadow-lg"
              preload="metadata"
            >
              <source src="${videoUrl}" type="video/mp4">
              <source src="${videoUrl}" type="video/webm">
              <source src="${videoUrl}" type="video/ogg">
              動画を再生するにはHTML5対応のブラウザが必要です。
            </video>
          </div>
        `;
      }
      return match;
    },
  );

  // 参照リンク定義を削除（表示不要）
  html = html.replace(/\[video-\d+\]:\s*.+$/gm, "");

  return html;
};

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize, {
      // 動画埋め込みを許可するようにサニタイズ設定を更新
      ...defaultSchema,
      tagNames: [...(defaultSchema.tagNames || []), "iframe", "blockquote", "video", "source"],
      attributes: {
        ...defaultSchema.attributes,
        iframe: [
          "src",
          "width",
          "height",
          "frameborder",
          "allow",
          "allowfullscreen",
          "title",
          "class",
        ],
        video: [
          "src",
          "width",
          "height",
          "controls",
          "autoplay",
          "loop",
          "muted",
          "poster",
          "preload",
          "class",
        ],
        source: ["src", "type"],
        blockquote: ["class", "cite", "data-video-id"],
        div: [...(defaultSchema.attributes?.div || []), "class"],
      },
      protocols: {
        ...defaultSchema.protocols,
        src: ["https"],
      },
    })
    .use(rehypeStringify)
    .process(markdown);

  let html = result.toString();

  // 動画埋め込み処理
  html = processVideoEmbeds(html);

  return html;
}

// Markdownから見出しを抽出する（目次用）
export function extractHeadings(
  markdown: string,
): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length; // 見出しのレベル
    const text = match[2].trim(); // 見出しのテキスト
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-"); // ID用のスラグ化

    headings.push({ level, text, id });
  }
  return headings;
}
