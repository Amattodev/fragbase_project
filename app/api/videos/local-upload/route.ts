import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// 最大ファイルサイズ: 200MB（ローカルは緩めに設定）
const MAX_FILE_SIZE = 200 * 1024 * 1024;

// 許可する動画フォーマット
const ALLOWED_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
];

export async function POST(request: NextRequest) {
  try {
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

    // ディレクトリが存在しない場合は作成
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // ファイル名を生成（タイムスタンプ + オリジナル名）
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${originalName}`;
    
    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // public/uploads/videosディレクトリに保存
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);
    
    // レスポンス（R2と同じ形式）
    return NextResponse.json({
      success: true,
      result: {
        id: fileName,
        filename: file.name,
        uploaded: new Date().toISOString(),
        url: `/uploads/videos/${fileName}`,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("ローカル動画アップロードエラー:", error);
    return NextResponse.json(
      { 
        success: false, 
        errors: [{ message: (error as Error).message }]
      },
      { status: 500 }
    );
  }
}