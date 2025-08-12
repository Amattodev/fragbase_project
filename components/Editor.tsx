"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Editor,
  rootCtx,
  editorViewOptionsCtx,
  defaultValueCtx,
} from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { Milkdown, useEditor } from "@milkdown/react";
import { Button } from "@/components/ui/button";

interface EditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
}

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

          if (!tokenData.ok) {
            throw new Error("アップロードトークンの取得に失敗");
          }

          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetch(tokenData.uploadUrl!, {
            method: "POST",
            body: formData,
          });

          const uploadResult =
            (await uploadRes.json()) as CloudflareUploadResult;

          if (!uploadResult.success) {
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

  // 手動保存ボタン
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

  // エディタの初期化（シンプル版）
  useEditor(
    (root) => {
      return Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.set(defaultValueCtx, content);
          ctx.set(editorViewOptionsCtx, {
            attributes: {
              class:
                "prose prose-invert max-w-none min-h-[400px] p-4 focus:outline-none bg-[#2B2B2B] text-[#F5F5F5] rounded-lg border-none",
              "data-testid": "milkdown-editor",
            },
            handleDOMEvents: {
              // 入力イベントを監視
              input: (view) => {
                setTimeout(() => {
                  const markdown = view.state.doc.textContent || "";
                  if (markdown !== editorContent) {
                    setEditorContent(markdown);
                    onChange(markdown);
                  }
                }, 0);
                return false;
              },
              // キーボード入力も監視
              keyup: (view) => {
                const markdown = view.state.doc.textContent || "";
                if (markdown !== editorContent) {
                  setEditorContent(markdown);
                  onChange(markdown);
                }
                return false;
              },
            },
          });
        })
        .use(commonmark);
    },
    [content]
  );

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
      <div className="h-[calc(100%-60px)] bg-[#2B2B2B] rounded-lg overflow-hidden">
        <Milkdown />
      </div>
    </div>
  );
}
