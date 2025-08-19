import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

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

    // ファイル名を生成（タイムスタンプ + オリジナル名）
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${originalName}`;
    
    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // public/uploadsディレクトリに保存
    const filePath = path.join(process.cwd(), "public", "uploads", fileName);
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