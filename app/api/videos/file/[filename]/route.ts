import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  const filename = params.filename;
  const key = `videos/${decodeURIComponent(filename)}`;

  // Cloudflare R2 binding (Workers/preview/production)
  const ctx =
    (globalThis as any)[Symbol.for("__cloudflare_context__")] ||
    (globalThis as any)[Symbol.for("__cloudflare-context__")] ||
    (globalThis as any);
  const bucket: R2Bucket | undefined = (ctx?.env?.VIDEOS_BUCKET || ctx?.VIDEOS_BUCKET) as
    | R2Bucket
    | undefined;

  if (!bucket) {
    return NextResponse.json({ ok: false, error: "R2 bucket not available" }, { status: 500 });
  }

  const rangeHeader = request.headers.get("Range");
  let offset: number | undefined;
  let length: number | undefined;

  if (rangeHeader) {
    // e.g., "bytes=0-" or "bytes=1024-2047"
    const m = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    if (m) {
      offset = parseInt(m[1], 10);
      if (m[2]) {
        const end = parseInt(m[2], 10);
        length = end >= offset ? end - offset + 1 : undefined;
      }
    }
  }

  const getOpts: R2GetOptions = {};
  if (typeof offset === "number") {
    getOpts.range = { offset, length };
  }

  const object = (await bucket.get(key, getOpts)) as R2ObjectBody | null;
  if (!object) {
    return NextResponse.json({ ok: false, error: "Video not found" }, { status: 404 });
  }

  // Infer content type from metadata or filename
  const contentType = object.httpMetadata?.contentType ||
    (filename.endsWith(".webm")
      ? "video/webm"
      : filename.endsWith(".ogg")
        ? "video/ogg"
        : filename.endsWith(".mov")
          ? "video/quicktime"
          : "video/mp4");

  const size = object.size;
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  if (typeof offset === "number") {
    const start = offset;
    const end = length ? start + length - 1 : size - 1;
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new NextResponse(object.body as ReadableStream, { status: 206, headers });
  } else {
    headers.set("Content-Length", String(size));
    return new NextResponse(object.body as ReadableStream, { status: 200, headers });
  }
}
