import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 環境の判定（ローカル開発環境かどうか）
    const isLocal = process.env.NODE_ENV === "development" || !process.env.CLOUDFLARE_ACCOUNT_ID;

    if (isLocal) {
      // ローカル環境の場合はlocal-uploadエンドポイントを返す
      return NextResponse.json({
        ok: true,
        uploadUrl: "/api/videos/local-upload",
        isLocal: true,
      });
    } else {
      // 本番環境（Cloudflare）の場合はuploadエンドポイントを返す
      return NextResponse.json({
        ok: true,
        uploadUrl: "/api/videos/upload",
        isLocal: false,
      });
    }
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
