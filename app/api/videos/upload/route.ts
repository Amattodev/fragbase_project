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

export async function POST(request: NextRequest) {
  // Cloudflareコンテキストから正しくR2バケットを取得
  const cloudflareContext = (globalThis as any)[Symbol.for("__cloudflare-context__")];
  const VIDEOS_BUCKET = cloudflareContext?.env?.VIDEOS_BUCKET;
  
  console.log("🔧 環境変数デバッグ:");
  console.log("  cloudflareContext:", !!cloudflareContext);
  console.log("  cloudflareContext.env:", !!cloudflareContext?.env);
  console.log("  VIDEOS_BUCKET:", !!VIDEOS_BUCKET);
  console.log("  VIDEOS_BUCKET type:", typeof VIDEOS_BUCKET);
  
  if (cloudflareContext?.env) {
    console.log("  利用可能なバインディング:", Object.keys(cloudflareContext.env));
  }

  try {
    if (!VIDEOS_BUCKET) {
      return NextResponse.json(
        {
          success: false,
          errors: [{ message: "R2バケットが設定されていません" }],
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
          errors: [
            {
              message: `ファイルサイズは${
                MAX_FILE_SIZE / 1024 / 1024
              }MB以下にしてください`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // フォーマットチェック
    if (!ALLOWED_FORMATS.includes(file.type)) {
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
        { status: 400 }
      );
    }

    // ファイル名を生成（タイムスタンプ + UUID風 + オリジナル名）
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${randomId}_${originalName}`;
    const r2Key = `videos/${fileName}`; // R2内のキー

    // ファイルをR2にアップロード
    console.log("📤 R2アップロード開始:");
    console.log("  バケット:", VIDEOS_BUCKET ? "✅ 利用可能" : "❌ 利用不可");
    console.log("  R2キー:", r2Key);
    console.log("  元ファイル名:", file.name);
    
    const bytes = await file.arrayBuffer();
    console.log("  バイトデータ変換完了:", bytes.byteLength, "bytes");
    
    // HTTPメタデータを設定（ブラウザが正しく認識できるように）
    const httpMetadata: any = {
      contentType: file.type || "video/mp4", // フォールバック
      cacheControl: "public, max-age=31536000", // 1年のキャッシュ
      contentDisposition: "inline", // ブラウザで直接表示
    };
    
    console.log("  HTTPメタデータ:", httpMetadata);
    
    try {
      const putResult = await VIDEOS_BUCKET.put(r2Key, bytes, {
        httpMetadata,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString(),
          publicAccess: "true", // パブリックアクセス可能
        },
      });
      
      console.log("✅ R2 PUT操作完了");
      console.log("  PUT結果:", putResult ? "成功" : "失敗");
      console.log("  PUT詳細:", putResult);
      
      // PUT操作直後にバケットの状態確認
      console.log("🔍 PUT直後のバケット確認:");
      const immediateCheck = await VIDEOS_BUCKET.get(r2Key);
      console.log("  即座チェック:", immediateCheck ? "✅ 存在" : "❌ 見つからない");
      
    } catch (putError) {
      console.error("❌ R2 PUT操作失敗:");
      console.error("  エラー名:", (putError as Error).name);
      console.error("  エラーメッセージ:", (putError as Error).message);
      console.error("  スタックトレース:", (putError as Error).stack);
      
      throw new Error(`R2アップロードエラー: ${(putError as Error).message}`);
    }

    // 公開URLを生成（環境変数から取得）
    const publicUrl =
      process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://pub-26399b3d6caf4d29abf7fbd21e310972.r2.dev";
    const fileUrl = `${publicUrl}/${r2Key}`;

    // アップロード後の検証
    // アップロード検証（少し遅延させて確実にチェック）
    try {
      // 少し待ってから確認（R2の反映遅延を考慮）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const uploadedObject = await VIDEOS_BUCKET.get(r2Key);
      console.log("✅ アップロード完了:");
      console.log("  R2キー:", r2Key);
      console.log("  公開URL:", fileUrl);
      console.log("  Content-Type:", file.type);
      console.log("  ファイルサイズ:", file.size);
      console.log("  R2での確認:", uploadedObject ? "✅ 存在" : "❌ 見つからない");
      
      if (uploadedObject) {
        console.log("  R2オブジェクト詳細:");
        console.log("    サイズ:", uploadedObject.size);
        console.log("    Content-Type:", uploadedObject.httpMetadata?.contentType);
        console.log("    アップロード時刻:", uploadedObject.uploaded);
      } else {
        // バケット内の全オブジェクトを一覧表示
        console.log("🔍 バケット内容確認:");
        const listResult = await VIDEOS_BUCKET.list({ limit: 10 });
        console.log("  総オブジェクト数:", listResult.objects?.length || 0);
        listResult.objects?.forEach((obj: any, index: number) => {
          console.log(`    ${index + 1}. ${obj.key} (${obj.size} bytes)`);
        });
      }
    } catch (verifyError) {
      console.error("❌ アップロード検証エラー:", verifyError);
    }

    // レスポンス（local-uploadと同じ形式）
    return NextResponse.json({
      success: true,
      result: {
        id: r2Key, // R2キーを返す
        filename: file.name,
        uploaded: new Date().toISOString(),
        url: fileUrl,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("❌ アップロードエラー:", (error as Error).message);
    return NextResponse.json(
      {
        success: false,
        errors: [{ message: (error as Error).message }],
      },
      { status: 500 }
    );
  }
}
