"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { extractHeadings } from "@/lib/markdown";

// 動的インポートでMDEditorを読み込み（SSR回避）
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface UploadTokenResponse {
  ok: boolean;
  uploadUrl?: string;
  imageId?: string;
  error?: string;
  isLocal?: boolean;
}

interface CloudflareUploadResult {
  success: boolean;
  result?: {
    id: string;
    variants?: string[];
  };
  errors?: unknown[];
}

interface EditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
}

export default function EditorComponent({
  content,
  onChange,
  onSave,
  hasUnsavedChanges = false,
}: EditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [imageCounter, setImageCounter] = useState(1);

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

          // ローカル環境かCloudflare Imagesかで画像URLを切り替え
          let imageUrl: string;
          if (tokenData.isLocal && uploadResult.result.variants) {
            // ローカル環境の場合はBase64データURLを使用
            imageUrl = uploadResult.result.variants[0];
          } else {
            // 本番環境の場合はCloudflare ImagesのURLを生成
            const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
            if (!accountHash) {
              // アカウントハッシュがない場合はローカル画像として扱う
              imageUrl = uploadResult.result.variants?.[0] || `/images/${uploadResult.result.id}`;
            } else {
              imageUrl = `https://imagedelivery.net/${accountHash}/${uploadResult.result.id}/public`;
            }
          }
          
          // 現在のコンテンツから既存の画像参照番号を取得
          const existingRefs = editorContent.match(/\[image-(\d+)\]:/g) || [];
          const maxRef = existingRefs.reduce((max, ref) => {
            const num = parseInt(ref.match(/\d+/)?.[0] || "0");
            return Math.max(max, num);
          }, 0);
          const currentImageNum = maxRef + 1;
          
          // 参照リンク形式でMarkdownを生成
          const imageRefName = `image-${currentImageNum}`;
          const imageText = `![${file.name}][${imageRefName}]`;
          
          // コンテンツの末尾に参照リンクを追加（既存の参照リンクがある場合はその後に追加）
          let newContent = editorContent;
          
          // 既存の参照リンクセクションを探す
          const refSectionMatch = newContent.match(/\n\n\[image-\d+\]:.*/g);
          if (refSectionMatch) {
            // 既存の参照リンクセクションの最後に追加
            const lastRefIndex = newContent.lastIndexOf(refSectionMatch[refSectionMatch.length - 1]);
            const endOfLastRef = lastRefIndex + refSectionMatch[refSectionMatch.length - 1].length;
            newContent = 
              newContent.slice(0, endOfLastRef) + 
              `\n[${imageRefName}]: ${imageUrl}` + 
              newContent.slice(endOfLastRef);
            
            // 画像タグを適切な位置に挿入（カーソル位置または末尾）
            const insertPos = newContent.lastIndexOf('\n\n[image-');
            newContent = 
              newContent.slice(0, insertPos) + 
              "\n\n" + imageText + 
              newContent.slice(insertPos);
          } else {
            // 参照リンクセクションがない場合は新規作成
            newContent = editorContent + "\n\n" + imageText + "\n\n[" + imageRefName + "]: " + imageUrl;
          }
          
          setEditorContent(newContent);
          onChange(newContent);
          setImageCounter(currentImageNum + 1);
        } catch (error) {
          console.error("画像アップロードエラー:", error);
          alert("画像のアップロードに失敗しました");
        }
      }
    };
    input.click();
  }, [editorContent, onChange, imageCounter]);

  const extractYoutubeId = (url: string): string | null => {
    // 通常の動画
    const videoPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of videoPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `video:${match[1]}`;
      }
    }

    // ライブ配信
    const livePattern = /youtube\.com\/live\/([^&\n?#]+)/;
    const liveMatch = url.match(livePattern);
    if (liveMatch && liveMatch[1]) {
      return `live:${liveMatch[1]}`;
    }

    // ショート動画
    const shortsPattern = /youtube\.com\/shorts\/([^&\n?#]+)/;
    const shortsMatch = url.match(shortsPattern);
    if (shortsMatch && shortsMatch[1]) {
      return `shorts:${shortsMatch[1]}`;
    }

    // チャンネル
    const channelPatterns = [
      /youtube\.com\/channel\/([^/?#]+)/,
      /youtube\.com\/c\/([^/?#]+)/,
      /youtube\.com\/@([^/?#]+)/,
    ];

    for (const pattern of channelPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `channel:${match[1]}`;
      }
    }

    return null;
  };

  const extractTwitchId = (url: string): string | null => {
    // クリップの場合
    const clipPatterns = [
      /clips\.twitch\.tv\/([^/?#]+)/,
      /twitch\.tv\/[^/]+\/clip\/([^/?#]+)/,
    ];

    for (const pattern of clipPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `clip:${match[1]}`;
      }
    }

    // 動画の場合
    const videoPattern = /twitch\.tv\/videos\/([0-9]+)/;
    const videoMatch = url.match(videoPattern);
    if (videoMatch && videoMatch[1]) {
      return `video:${videoMatch[1]}`;
    }

    // ライブ配信（チャンネル）の場合
    const channelPattern = /twitch\.tv\/([^/?#]+)$/;
    const channelMatch = url.match(channelPattern);
    if (channelMatch && channelMatch[1]) {
      return `channel:${channelMatch[1]}`;
    }

    return null;
  };

  const extractTikTokId = (url: string): string | null => {
    // 動画の場合
    const videoPattern = /tiktok\.com\/@[^/]+\/video\/([0-9]+)/;
    const videoMatch = url.match(videoPattern);
    if (videoMatch && videoMatch[1]) {
      return `video:${videoMatch[1]}`;
    }

    // ユーザー（チャンネル）の場合
    const userPattern = /tiktok\.com\/@([^/?#]+)$/;
    const userMatch = url.match(userPattern);
    if (userMatch && userMatch[1]) {
      return `channel:${userMatch[1]}`;
    }

    return null;
  };

  const extractXId = (url: string): string | null => {
    // 投稿の場合
    const postPatterns = [
      /(?:twitter|x)\.com\/[^/]+\/status\/([0-9]+)/,
      /(?:twitter|x)\.com\/i\/web\/status\/([0-9]+)/,
    ];

    for (const pattern of postPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `post:${match[1]}`;
      }
    }

    // アカウントの場合
    const accountPattern = /(?:twitter|x)\.com\/([^/?#]+)$/;
    const accountMatch = url.match(accountPattern);
    if (
      accountMatch &&
      accountMatch[1] &&
      ![
        "home",
        "explore",
        "notifications",
        "messages",
        "bookmarks",
        "lists",
      ].includes(accountMatch[1])
    ) {
      return `account:${accountMatch[1]}`;
    }

    return null;
  };

  const handleVideoEmbed = useCallback(
    (service: "youtube" | "twitch" | "tiktok") => {
      const serviceConfig = {
        youtube: {
          promptMessage: "YouTubeのURLを入力してください:",
          extract: extractYoutubeId,
        },
        twitch: {
          promptMessage: "TwitchのURLを入力してください:",
          extract: extractTwitchId,
        },
        tiktok: {
          promptMessage: "TikTokのURLを入力してください:",
          extract: extractTikTokId,
        },
      };

      const config = serviceConfig[service];
      const url = prompt(config.promptMessage);
      if (url) {
        const videoId = config.extract(url);
        if (videoId) {
          const embedText = `[${service}:${videoId}]`;
          const newContent = editorContent + "\n\n" + embedText + "\n\n";
          setEditorContent(newContent);
          onChange(newContent);
        } else {
          alert(`有効な${service}のURLを入力してください`);
        }
      }
    },
    [editorContent, onChange]
  );

  const handleXEmbed = useCallback(() => {
    const url = prompt("X（Twitter）のURLを入力してください:");
    if (url) {
      const xId = extractXId(url);
      if (xId) {
        const embedText = `[x:${xId}]`;
        const newContent = editorContent + "\n\n" + embedText + "\n\n";
        setEditorContent(newContent);
        onChange(newContent);
      } else {
        alert("有効なX（Twitter）のURLを入力してください");
      }
    }
  }, [editorContent, onChange]);

  // 手動保存
  const handleManualSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  // キーボードショートカットで保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);

  // エディタの値変更ハンドラ
  const handleEditorChange = (value?: string) => {
    const newContent = value || "";
    setEditorContent(newContent);
    onChange(newContent);
  };

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
          onClick={() => handleVideoEmbed("youtube")}
          variant="outline"
          size="sm"
          className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
        >
          🎥 YouTube
        </Button>
        <Button
          onClick={() => handleVideoEmbed("twitch")}
          variant="outline"
          size="sm"
          className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
        >
          🎥 twitch
        </Button>
        <Button
          onClick={() => handleVideoEmbed("tiktok")}
          variant="outline"
          size="sm"
          className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
        >
          🎥 tiktok
        </Button>
        <Button
          onClick={handleXEmbed}
          variant="outline"
          size="sm"
          className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
        >
          🐦 X
        </Button>
        <Button
          onClick={handleManualSave}
          variant="outline"
          size="sm"
          className={`${
            hasUnsavedChanges
              ? "bg-[#FF6B6B] text-white hover:bg-[#FF5252] animate-pulse"
              : "bg-[#7DB7E8] text-black hover:bg-[#6AA3D5]"
          }`}
        >
          {hasUnsavedChanges ? "💾 未保存" : "💾 保存"}
        </Button>

        {hasUnsavedChanges && (
          <div className="flex items-center text-sm text-[#FF6B6B]">
            <span className="inline-block w-2 h-2 bg-[#FF6B6B] rounded-full mr-2 animate-pulse"></span>
            未保存の変更があります
          </div>
        )}
      </div>

      {/* エディタ本体 */}
      <div
        className="h-[calc(100%-60px)] rounded-lg overflow-hidden"
        data-color-mode="dark"
      >
        <MDEditor
          value={editorContent}
          onChange={handleEditorChange}
          height={500}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={false}
          data-color-mode="dark"
          style={{
            backgroundColor: "#2B2B2B",
          }}
        />
      </div>
    </div>
  );
}
