import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
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

export async function markdownToHtml(markdown: string): Promise<string> {
  const customSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), "iframe"],
    attribute: {
      ...defaultSchema.attributes,
      iframe: [
        "width",
        "height",
        "src",
        "title",
        "frameborder",
        "allow",
        "allowfullscreen",
      ],
    },
  };

  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSanitize, customSchema)
      .use(rehypeStringify)
      .process(markdown);
    let html = String(file);

    html = autoEmbedYouTube(html);

    return html;
  } catch (error) {
    console.error("Markdown変換エラー:", error);
    return "";
  }
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
