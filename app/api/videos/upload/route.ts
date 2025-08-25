import { NextRequest, NextResponse } from "next/server";

// 最大ファイルサイズ: 100MB（R2は制限が厳しいため）
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// 許可する動画フォーマット
const ALLOWED_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
];

interface Context {
  env: CloudflareEnv;
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { env } = context;
    
    if (!env.VIDEOS_BUCKET) {
      return NextResponse.json(
        { 
          success: false, 
          errors: [{ message: "R2バケットが設定されていません" }] 
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, errors: [{ message: "ファイルが見つかりません" }] },
        { status: 400 }
      );
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          errors: [{ message: `ファイルサイズは${MAX_FILE_SIZE / 1024 / 1024}MB以下にしてください` }] 
        },
        { status: 400 }
      );
    }

    // フォーマットチェック
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          errors: [{ message: "サポートされていない動画フォーマットです。MP4, WebM, OGG, MOVのみ対応しています。" }] 
        },
        { status: 400 }
      );
    }

    // ファイル名を生成（タイムスタンプ + UUID風 + オリジナル名）
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `videos/${timestamp}_${randomId}_${originalName}`;
    
    // ファイルをR2にアップロード
    const bytes = await file.arrayBuffer();
    
    await env.VIDEOS_BUCKET.put(fileName, bytes, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
      },
    });
    
    // 公開URLを生成（環境変数から取得）
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://fragbase-videos.r2.dev";
    const fileUrl = `${publicUrl}/${fileName}`;
    
    // レスポンス（local-uploadと同じ形式）
    return NextResponse.json({
      success: true,
      result: {
        id: fileName,
        filename: file.name,
        uploaded: new Date().toISOString(),
        url: fileUrl,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("R2動画アップロードエラー:", error);
    return NextResponse.json(
      { 
        success: false, 
        errors: [{ message: (error as Error).message }]
      },
      { status: 500 }
    );
  }
}