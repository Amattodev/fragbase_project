import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
// import { auth } from "@/auth"; // 一時的にコメントアウト
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（現在は一時的にコメントアウト - Cloudflareビルドエラー回避）
    // TODO: Cloudflare環境での認証を修正する必要あり
    /*
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, errors: [{ message: "ログインが必要です" }] },
        { status: 401 }
      );
    }
    */

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, errors: [{ message: "ファイルが見つかりません" }] },
        { status: 400 }
      );
    }

    // ファイル名を生成（タイムスタンプ + オリジナル名）
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${originalName}`;
    
    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // uploadsディレクトリが存在しない場合は作成
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // ディレクトリがすでに存在する場合のエラーは無視
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }

    // public/uploadsディレクトリに保存
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    // レスポンス（Cloudflare Images APIと同じ形式）
    return NextResponse.json({
      success: true,
      result: {
        id: fileName,
        filename: file.name,
        uploaded: new Date().toISOString(),
        variants: [`/uploads/${fileName}`],
      },
    });
  } catch (error) {
    console.error("ローカル画像アップロードエラー:", error);
    return NextResponse.json(
      { 
        success: false, 
        errors: [{ message: (error as Error).message }]
      },
      { status: 500 }
    );
  }
}