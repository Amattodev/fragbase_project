import { NextResponse } from "next/server";

export async function GET() {
  try {
    // すべての環境で同一オリジンの local-upload を使用
    // local-upload は Workers では R2 に保存し、Node では public/uploads に保存する
    return NextResponse.json({ ok: true, uploadUrl: "/api/videos/local-upload", isLocal: true });
  } catch (error) {
    console.error("Upload token取得エラー:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "アップロードトークンの取得に失敗しました",
      },
      { status: 500 },
    );
  }
}
