"use client";

import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  GameSetting,
  ApexSetting,
  ValorantSetting,
  Overwatch2Setting,
} from "@/types/type";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CommentsSection from "@/components/CommentsSection";
// ダミーデータ（本番では外部化またはデータフェッチに置き換え）
//TODO:0729コメントの型管理を別のファイルで管理したい
type Comment = {
  id: number;
  text: string;
  createdAt: string;
  username: string;
};

type ApiResponse = {
  ok: boolean;
  data?: GameSetting;
  error?: string;
};

// ゲーム固有の設定をレンダリングするコンポーネント
const GameSpecificSettings = ({ setting }: { setting: GameSetting }) => {
  switch (setting.gameTitle) {
    case "APEX":
      const apexSetting = setting as ApexSetting;
      return (
        <>
          <tr>
            <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
              視点感度
            </th>
            <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
              {apexSetting.sensitivity || "-"}
            </td>
            <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
              Aim感度
            </th>
            <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
              {apexSetting.aimSensitivity || "-"}
            </td>
          </tr>
          <tr>
            <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
              反応曲線
            </th>
            <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
              {apexSetting.reactcurve || "-"}
            </td>
            <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
              デッドゾーン
            </th>
            <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
              {apexSetting.deadZone || "-"}
            </td>
          </tr>
        </>
      );
    case "VALORANT":
      const valorantSetting = setting as ValorantSetting;
      return (
        <>
          <tr>
            <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
              感度
            </th>
            <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
              {valorantSetting.sensitivity || "-"}
            </td>
          </tr>
        </>
      );
    case "OVERWATCH2":
      const overwatchSetting = setting as Overwatch2Setting;
      return (
        <>
          <tr>
            <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
              感度
            </th>
            <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
              {overwatchSetting.sensitivity || "-"}
            </td>
          </tr>
        </>
      );
    default:
      return null;
  }
};

export default function PostDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const settingId = parseInt(params.id as string);
  const returnUrl = searchParams.get("returnUrl") || "/";

  // 設定データのステート
  const [setting, setSetting] = useState<GameSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // コメント関連のステート
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      text: "感度参考になりました！",
      username: "匿名ユーザー",
      createdAt: "2023/12/15",
    },
    {
      id: 2,
      text: "DPI同じで親近感湧きました",
      username: "匿名ユーザー",
      createdAt: "2023/12/16",
    },
  ]);
  const [newComment, setNewComment] = useState("");

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const getUserIdentifier = () => {
    let identifier = localStorage.getItem("userIdentifier");
    if (!identifier) {
      identifier = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("userIdentifier", identifier);
    }
    return identifier;
  };

  const handleLikeToggle = async () => {
    try {
      const response = await fetch(`/api/settings/${settingId}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIdentifier: getUserIdentifier(),
        }),
      });
      //TODO: ここでのレスポンスの型を明確にする
      const result = (await response.json()) as {
        ok: boolean;
        likesCount?: number;
        error?: string;
      };
      if (response.ok) {
        setIsLiked(!isLiked);
        await fetchLikesCount();
      } else {
        console.error("いいねの更新に失敗:");
      }
    } catch (error) {
      console.error("いいね数の取得に失敗しました:", error);
    }
  };

  const fetchLikesCount = async () => {
    try {
      const response = await fetch(`/api/settings/${settingId}/likes/count`);
      //TODO: ここでのレスポンスの型を明確にする
      const result = (await response.json()) as {
        ok: boolean;
        likesCount?: number;
        error?: string;
      };
      if (response.ok) {
        setLikesCount(result.likesCount || 0);
      } else {
        console.error("いいね数の取得に失敗:", result.error);
      }
    } catch (error) {
      console.error("いいね数の取得に失敗しました:", error);
    }
  };

  // APIから投稿データを取得
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await fetch(`/api/settings/${settingId}`);
        const result = (await res.json()) as ApiResponse;

        if (!res.ok || !result.ok) {
          throw new Error(result.error || "データの取得に失敗しました");
        }

        setSetting(result.data || null);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (settingId) {
      fetchSetting();
      fetchLikesCount();
    }
  }, [settingId]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">エラー: {error}</p>
      </div>
    );
  }

  // データが見つからない場合
  if (!setting) {
    notFound();
  }

  return (
    <>
      {/* 投稿詳細カード */}
      <div className="flex justify-center">
        <Card className="bg-[#2B2B2B] p-6 w-full max-w-xl">
          <CardContent className="space-y-6 relative pb-8">
            <h2 className="text-xl font-semibold text-[#F9F9F9]">
              {setting.gameTitle} - {setting.character}({setting.role})
            </h2>
            <p className="text-[#BBBBBB] text-sm">
              FPS歴：{setting.fpsExperience}
            </p>

            {/* 設定テーブル */}
            <table className="w-full border-collapse mt-4">
              <tbody>
                {/* 共通設定 */}
                <tr>
                  <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
                    DPI
                  </th>
                  <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
                    {setting.dpi}
                  </td>
                  <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">
                    デバイス
                  </th>
                  <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">
                    {setting.device}
                  </td>
                </tr>

                {/* ゲーム固有設定 */}
                <GameSpecificSettings setting={setting} />
              </tbody>
            </table>

            {/* 投稿者コメント */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span>📝</span>
                <h3 className="text-lg font-semibold text-[#F9F9F9]">
                  投稿者コメント
                </h3>
              </div>
              <p className="text-[#BBBBBB] text-sm">
                {setting.comment || "コメントはありません"}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 text-xs text-[#888888]">
              投稿日: {setting.createdAt}
            </div>

            {/* いいねボタン */}
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleLikeToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded 
                    transition-colors ${
                      isLiked
                        ? "bg-red-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
              >
                <span>{isLiked ? "❤️" : "🤍"}</span>
                <span>{likesCount}</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <CommentsSection settingId={settingId} />
    </>
  );
}
