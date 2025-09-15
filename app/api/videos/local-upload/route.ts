import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { MAX_VIDEO_FILE_SIZE, ALLOWED_VIDEO_MIME_TYPES, DEFAULT_R2_PUBLIC_URL } from "@/constants/upload";

export async function POST(request: NextRequest) {
  console.log("ローカル動画アップロード処理開始");
  try {
    const formData = await request.formData();
    console.log("FormData取得完了");
    const file = formData.get("file") as File;
    console.log("ファイル取得:", file ? `${file.name} (${file.size} bytes, ${file.type})` : "なし");

    if (!file) {
      console.error("ファイルが見つかりません");
      return NextResponse.json(
        { success: false, errors: [{ message: "ファイルが見つかりません" }] },
        { status: 400 },
      );
    }

    // ファイルサイズチェック
    console.log(`ファイルサイズチェック: ${file.size} bytes (制限: ${MAX_VIDEO_FILE_SIZE} bytes)`);
    if (file.size > MAX_VIDEO_FILE_SIZE) {
      console.error(`ファイルサイズ超過: ${file.size} > ${MAX_VIDEO_FILE_SIZE}`);
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              message: `ファイルサイズは${MAX_VIDEO_FILE_SIZE / 1024 / 1024}MB以下にしてください`,
            },
          ],
        },
        { status: 400 },
      );
    }

    // フォーマットチェック
    console.log(`フォーマットチェック: ${file.type} (許可: ${ALLOWED_VIDEO_MIME_TYPES.join(", ")})`);
    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type as any)) {
      console.error(`サポートされていないフォーマット: ${file.type}`);
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              message:
                "サポートされていない動画フォーマットです。MP4, WebM, OGG, MOVのみ対応しています。",
            },
          ],
        },
        { status: 400 },
      );
    }

    // Cloudflare Workers環境ではR2バケットを使用
    const VIDEOS_BUCKET =
      (globalThis as any)?.env?.VIDEOS_BUCKET || (globalThis as any)?.VIDEOS_BUCKET;
    console.log(`VIDEOS_BUCKET: ${VIDEOS_BUCKET ? "利用可能" : "利用不可"}`);

    if (VIDEOS_BUCKET) {
      // Cloudflare Workers環境 - R2バケットを使用
      console.log("Cloudflare Workers環境でR2バケットを使用");

      // ファイル名を生成
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${timestamp}_${originalName}`;
      const key = `videos/${fileName}`;
      console.log(`R2キー: ${key}`);

      // R2にアップロード
      console.log("R2アップロード開始");
      const arrayBuffer = await file.arrayBuffer();

      const httpMetadata: any = {
        contentType: file.type || "video/mp4",
        cacheControl: "public, max-age=31536000",
        contentDisposition: "inline",
      };

      await VIDEOS_BUCKET.put(key, arrayBuffer, {
        httpMetadata,
      });
      console.log("R2アップロード完了");

      // R2のパブリックURLを構築
      const r2PublicUrl =
        process.env.CLOUDFLARE_R2_PUBLIC_URL ||
        process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ||
        DEFAULT_R2_PUBLIC_URL;
      const videoUrl = `${r2PublicUrl}/${key}`;

      return NextResponse.json({
        success: true,
        result: {
          id: fileName,
          filename: file.name,
          uploaded: new Date().toISOString(),
          url: videoUrl,
          type: file.type,
          size: file.size,
        },
      });
    } else if (typeof process !== "undefined" && process.env && typeof require !== "undefined") {
      // Node.js環境 - 通常の開発環境
      const { writeFile, mkdir } = await import("fs/promises");
      const { existsSync } = await import("fs");

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
      console.log(`アップロードディレクトリ: ${uploadsDir}`);
      if (!existsSync(uploadsDir)) {
        console.log("ディレクトリを作成します");
        await mkdir(uploadsDir, { recursive: true });
      }

      // ファイル名を生成
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${timestamp}_${originalName}`;
      console.log(`生成されたファイル名: ${fileName}`);

      // ファイルを保存
      console.log("ファイルデータ読み込み開始");
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      console.log(`バッファ作成完了: ${buffer.length} bytes`);

      const filePath = path.join(uploadsDir, fileName);
      console.log(`ファイル保存パス: ${filePath}`);
      await writeFile(filePath, buffer);
      console.log("ファイル保存完了");

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
    } else {
      // Cloudflare Workers環境 - R2バケットを使用
      console.log("Cloudflare Workers環境でR2バケットを使用");

      const VIDEOS_BUCKET = process.env.VIDEOS_BUCKET || (globalThis as any).VIDEOS_BUCKET;

      if (!VIDEOS_BUCKET) {
        console.error("R2バケットが利用できません");
        return NextResponse.json(
          {
            success: false,
            errors: [{ message: "ストレージが利用できません" }],
          },
          { status: 500 },
        );
      }

      // ファイル名を生成
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${timestamp}_${originalName}`;
      const key = `videos/${fileName}`;
      console.log(`R2キー: ${key}`);

      // R2にアップロード
      console.log("R2アップロード開始");
      const arrayBuffer = await file.arrayBuffer();

      const httpMetadata: any = {
        contentType: file.type || "video/mp4",
        cacheControl: "public, max-age=31536000",
        contentDisposition: "inline",
      };

      await VIDEOS_BUCKET.put(key, arrayBuffer, {
        httpMetadata,
      });
      console.log("R2アップロード完了");

      // R2のパブリックURLを構築
      const r2PublicUrl =
        process.env.CLOUDFLARE_R2_PUBLIC_URL ||
        process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ||
        DEFAULT_R2_PUBLIC_URL;
      const videoUrl = `${r2PublicUrl}/${key}`;

      return NextResponse.json({
        success: true,
        result: {
          id: fileName,
          filename: file.name,
          uploaded: new Date().toISOString(),
          url: videoUrl,
          type: file.type,
          size: file.size,
        },
      });
    }
  } catch (error) {
    console.error("ローカル動画アップロードエラー:", error);
    return NextResponse.json(
      {
        success: false,
        errors: [{ message: (error as Error).message }],
      },
      { status: 500 },
    );
  }
}
