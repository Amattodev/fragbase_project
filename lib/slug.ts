import { ulid } from "ulid";

// 日本語文字列を正規化する
function normalizeText(text: string): string {
  return text
    .replace(/[\u30A1-\u30F6]/g, (match) =>
      String.fromCharCode(match.charCodeAt(0) - 0x60)
    )
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee)
    );
}

export function toSlug(title: string): string {
  const normalized = normalizeText(title);

  const cleaned = normalized
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const titlePart = cleaned.slice(0, 30).replace(/-$/, "");
  const uniqueId = ulid();
  return titlePart ? `${titlePart}-${uniqueId}` : uniqueId;
}

export function normalizeTitle(title: string): string {
  return normalizeText(title)
    .replace(/[^\w\s\u3040-\u309F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// スラッグからULIDを抽出する
export function extractUlidFromSlug(slug: string): string | null {
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.length === 26 && /^[0-9A-Z]+$/i.test(lastPart)) {
    return lastPart.toUpperCase();
  }
  return null;
}
