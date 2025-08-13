"use client";
import { useCallback, useEffect, useState } from "react";
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { MilkdownProvider, useInstance } from "@milkdown/react";
import { Button } from "@/components/ui/button";

interface UploadTokenResponse {
  ok: boolean;
  uploadUrl?: string;
  imageId?: string;
  error?: string;
}

interface CloudflareUploadResult {
  success: boolean;
  result?: {
    id: string;
  };
  errors?: any[];
}

interface EditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
}

export default function EditorComponent({
  content,
  onChange,
  onSave,
}: EditorProps) {
  const [editorContent, setEditorContent] = useState(content);

  // 画像アップロード処理
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const tokenRes = await fetch("/api/images/upload-token");
          const tokenData = (await tokenRes.json()) as UploadTokenResponse;

          if (!tokenData.ok || !tokenData.uploadUrl) {
            throw new Error("アップロードトークンの取得に失敗");
          }

          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetch(tokenData.uploadUrl, {
            method: "POST",
            body: formData,
          });

          const uploadResult =
            (await uploadRes.json()) as CloudflareUploadResult;

          if (!uploadResult.success || !uploadResult.result) {
            throw new Error("画像のアップロードに失敗");
          }

          const imageUrl = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${uploadResult.result.id}/public`;
          const imageText = `![${file.name}](${imageUrl})`;
          const newContent = editorContent + "\n\n" + imageText + "\n\n";
          setEditorContent(newContent);
          onChange(newContent);
        } catch (error) {
          console.error("画像アップロードエラー:", error);
          alert("画像のアップロードに失敗しました");
        }
      }
    };
    input.click();
  }, [editorContent, onChange]);

  // YouTube URL埋め込み
  const handleYouTubeEmbed = useCallback(() => {
    const url = prompt("YouTubeのURLを入力してください:");
    if (
      url &&
      (url.includes("youtube.com/watch") || url.includes("youtu.be/"))
    ) {
      const newContent = editorContent + "\n\n" + url + "\n\n";
      setEditorContent(newContent);
      onChange(newContent);
    } else if (url) {
      alert("有効なYouTubeのURLを入力してください");
    }
  }, [editorContent, onChange]);

  // 手動保存
  const handleManualSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  // 自動保存のデバウンス処理
  useEffect(() => {
    if (!editorContent || !onSave) return;
    const timeoutId = setTimeout(() => onSave(), 1500);
    return () => clearTimeout(timeoutId);
  }, [editorContent, onSave]);

  return (
    <div className="h-full">
      {/* ツールバー */}
      <div className="mb-4 flex gap-2">
        <Button
          onClick={handleImageUpload}
          variant="outline"
          size="sm"
          className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
        >
          📷 画像を挿入
        </Button>
        <Button
          onClick={handleYouTubeEmbed}
          variant="outline"
          size="sm"
          className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
        >
          🎥 YouTube
        </Button>
        <Button
          onClick={handleManualSave}
          variant="outline"
          size="sm"
          className="bg-[#7DB7E8] text-black hover:bg-[#6AA3D5]"
        >
          💾 保存
        </Button>
      </div>

      {/* エディタ本体 */}
      <div className="h-[calc(100%-60px)] bg-[#2B2B2B] rounded-lg overflow-hidden p-4">
        <MilkdownProvider>
          <MilkdownEditor
            content={content}
            onChange={(newContent) => {
              setEditorContent(newContent);
              onChange(newContent);
            }}
          />
        </MilkdownProvider>
      </div>
    </div>
  );
}

// シンプル版エディタコンポーネント
function MilkdownEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const [loading, get] = useInstance();
  const [editor, setEditor] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("useEffect - loading:", loading);
    const initEditor = async () => {
      console.log("エディタ初期化中...");
      //   if (loading || editor) return;
      try {
        console.log("エディタ初期化開始");
        // const editorInstance = Editor.make()
        //   .config((ctx) => {
        //     ctx.set(defaultValueCtx, content);
        //   })
        //   .use(commonmark);
        const instance = get();
        if (!instance) {
          console.error("エディタインスタンスが取得できません");
          return;
        }

        await instance.create();

        setIsReady(true);

        // // エディタを作成
        // console.log("エディタインスタンス作成中...");
        // await get().create(editorInstance);
        // setEditor(editorInstance);
        // console.log("エディタインスタンス作成完了");

        // 変更の監視（シンプルなアプローチ）
        // setTimeout(() => {
        //   console.log("エディタの変更監視を設定中");
        //   const editorDiv = document.querySelector("[data-milkdown-root]");
        //   if (editorDiv) {
        //     console.log("エディタ要素が見つかりました");
        //     editorDiv.addEventListener("input", () => {
        //       try {
        //         get().action((ctx) => {
        //           // マークダウン内容を取得する処理
        //           onChange(content); // 暫定的にcontentをそのまま返す
        //         });
        //       } catch (error) {
        //         console.log("エディタ内容取得エラー:", error);
        //       }
        //     });
        //   }
        // }, 1000);
      } catch (error) {
        console.error("エディタ初期化エラー:", error);
        setIsReady(false);
      }
    };

    const timeoutId = setTimeout(() => {
      console.log("エディタ初期化タイムアウト");
      initEditor();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [get]);

  if (loading) {
    return (
      <div className="p-4 text-center text-[#F5F5F5]">
        エディタを読み込み中...
      </div>
    );
  }

  return (
    <div
      className="h-full w-full prose prose-invert max-w-none"
      data-milkdown-root
    />
  );
}
