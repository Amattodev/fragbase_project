import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Cloudflareコンテキストから情報取得
    const cloudflareContext = (globalThis as any)[Symbol.for("__cloudflare-context__")];
    const VIDEOS_BUCKET = cloudflareContext?.env?.VIDEOS_BUCKET;
    
    if (!VIDEOS_BUCKET) {
      return NextResponse.json({
        error: "VIDEOS_BUCKET not found",
        context: !!cloudflareContext,
        envKeys: cloudflareContext?.env ? Object.keys(cloudflareContext.env) : []
      });
    }

    // R2バケット内のオブジェクト一覧を取得
    try {
      const listResult = await VIDEOS_BUCKET.list({ limit: 10 }); // より多くのファイルを表示
      
      console.log("🔍 R2バケットデバッグ情報:");
      console.log("  オブジェクト数:", listResult.objects?.length || 0);
      console.log("  切り捨て:", listResult.truncated);
      listResult.objects?.forEach((obj: any, index: number) => {
        console.log(`  ${index + 1}. ${obj.key} (${obj.size} bytes, ${obj.uploaded})`);
      });
      
      // 最新のファイルを取得してテスト
      const latestFile = listResult.objects?.[0];
      let fileAccessTest = null;
      
      if (latestFile) {
        const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://pub-26399b3d6caf4d29abf7fbd21e310972.r2.dev";
        const testUrl = `${publicUrl}/${latestFile.key}`;
        
        // R2から直接取得テスト
        try {
          const r2Object = await VIDEOS_BUCKET.get(latestFile.key);
          const r2Success = !!r2Object;
          
          // パブリックURL アクセステスト（HEADとGETの両方）
          let publicUrlTest = null;
          try {
            // まずHEADリクエストでヘッダー情報を取得
            const headResponse = await fetch(testUrl, { method: 'HEAD' });
            
            // 次にGETリクエストで実際にデータを取得（最初の1KBのみ）
            let getTest = null;
            try {
              const getResponse = await fetch(testUrl, { 
                method: 'GET',
                headers: {
                  'Range': 'bytes=0-1023' // 最初の1KBのみ
                }
              });
              const partialContent = await getResponse.arrayBuffer();
              getTest = {
                status: getResponse.status,
                ok: getResponse.ok,
                dataSize: partialContent.byteLength,
                supportsRange: getResponse.status === 206
              };
            } catch (getError) {
              getTest = {
                error: (getError as Error).message
              };
            }
            
            publicUrlTest = {
              url: testUrl,
              head: {
                status: headResponse.status,
                ok: headResponse.ok,
                headers: {
                  contentType: headResponse.headers.get('content-type'),
                  contentLength: headResponse.headers.get('content-length'),
                  cors: headResponse.headers.get('access-control-allow-origin'),
                  acceptRanges: headResponse.headers.get('accept-ranges'),
                  cacheControl: headResponse.headers.get('cache-control'),
                }
              },
              get: getTest
            };
          } catch (fetchError) {
            publicUrlTest = {
              url: testUrl,
              error: (fetchError as Error).message
            };
          }
          
          fileAccessTest = {
            fileName: latestFile.key,
            r2DirectAccess: r2Success,
            publicUrlTest
          };
        } catch (r2Error) {
          fileAccessTest = {
            fileName: latestFile.key,
            r2DirectAccess: false,
            error: (r2Error as Error).message
          };
        }
      }
      
      // 特定のファイルキーでのテスト（最近アップロードされたファイル）
      const specificKey = "videos/1756828531073_qri1ife4zg_20250722-0238-26.5438866.mp4";
      let specificFileTest = null;
      
      try {
        const specificObject = await VIDEOS_BUCKET.get(specificKey);
        const debugPublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://pub-26399b3d6caf4d29abf7fbd21e310972.r2.dev";
        const specificUrl = `${debugPublicUrl}/${specificKey}`;
        
        let specificUrlTest = null;
        try {
          const response = await fetch(specificUrl, { method: 'HEAD' });
          specificUrlTest = {
            url: specificUrl,
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          };
        } catch (fetchError) {
          specificUrlTest = {
            url: specificUrl,
            error: (fetchError as Error).message
          };
        }
        
        specificFileTest = {
          key: specificKey,
          r2Object: specificObject ? {
            size: specificObject.size,
            contentType: specificObject.httpMetadata?.contentType,
            uploaded: specificObject.uploaded,
          } : null,
          publicUrlTest: specificUrlTest
        };
      } catch (error) {
        specificFileTest = {
          key: specificKey,
          error: (error as Error).message
        };
      }

      return NextResponse.json({
        success: true,
        bucketInfo: {
          objectCount: listResult.objects?.length || 0,
          objects: listResult.objects?.map((obj: any) => ({
            key: obj.key,
            size: obj.size,
            modified: obj.uploaded,
          })) || [],
          truncated: listResult.truncated,
        },
        environment: {
          publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
          bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        },
        fileAccessTest,
        specificFileTest
      });
    } catch (listError) {
      return NextResponse.json({
        error: "Failed to list bucket objects",
        details: (listError as Error).message,
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      error: "Debug failed",
      details: (error as Error).message,
    }, { status: 500 });
  }
}