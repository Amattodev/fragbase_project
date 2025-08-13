import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkGfm from "remark-gfm";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

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
  return html.replace(
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
        `
  );
};

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize, {
      // 動画埋め込みを許可するようにサニタイズ設定を更新
      ...defaultSchema,
      tagNames: [...(defaultSchema.tagNames || []), "iframe", "blockquote"],
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
  markdown: string
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
