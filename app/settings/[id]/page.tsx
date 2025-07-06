"use client";

import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { GameSetting, ApexSetting, ValorantSetting, Overwatch2Setting } from "@/types/type";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CommentsSection from "@/components/CommentsSection";
// ダミーデータ（本番では外部化またはデータフェッチに置き換え）
//TODO:コメントの型管理を別のファイルで管理したい
type Comment = {
    id: number;
    text: string;
    createdAt: string;
    username: string;
}

type ApiResponse = {
    ok: boolean;
    data?: GameSetting;
    error?: string;
};

// ゲーム固有の設定をレンダリングするコンポーネント
// TODO:ゲームごとに記入項目が違いUIテーブル管理しづらい
// TODO:項目名の色が明るい
// TODO:戻るボタンの導入
const GameSpecificSettings = ({ setting }: { setting: GameSetting }) => {
switch (setting.gameTitle) {
case "APEX":
    const apexSetting = setting as ApexSetting;
    return (
    <>
        <tr>
        <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">視点感度</th>
        <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{apexSetting.sensitivity || "-"}</td>
        <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">Aim感度</th>
        <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{apexSetting.aimSensitivity || "-"}</td>
        </tr>
        <tr>
        <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">反応曲線</th>
        <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{apexSetting.reactcurve || "-"}</td>
        <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">デッドゾーン</th>
        <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{apexSetting.deadZone || "-"}</td>
        </tr>
    </>
    );
case "VALORANT":
    const valorantSetting = setting as ValorantSetting;
    return (
    <>
        <tr>
        <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">感度</th>
        <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{valorantSetting.sensitivity || "-"}</td>
        </tr>
    </>
    );
case "OVERWATCH2":
    const overwatchSetting = setting as Overwatch2Setting;
    return (
    <>
        <tr>
        <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">感度</th>
        <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{overwatchSetting.sensitivity || "-"}</td>
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
const returnUrl = searchParams.get('returnUrl') || '/';

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
        createdAt: "2023/12/15"
    },
    {
        id: 2,
        text: "DPI同じで親近感湧きました",
        username: "匿名ユーザー",
        createdAt: "2023/12/16"
    }
]);
const [newComment, setNewComment] = useState("");

// APIから投稿データを取得
useEffect(() => {
    const fetchSetting = async () => {
        try {
            const res = await fetch(`/api/settings/${settingId}`);
            const result = await res.json() as ApiResponse;

            if (!res.ok || !result.ok) {
                throw new Error(result.error || 'データの取得に失敗しました');
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

// コメント投稿処理
const handlePostComment = () => {
if (!newComment.trim()) return; // 空のコメントは投稿しない

// 現在の日付を取得
const now = new Date();
const formattedDate = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

// 新しいコメントを作成
const newCommentObj: Comment = {
    id: comments.length + 1,
    text: newComment,
    username: "匿名ユーザー", // 実際のアプリでは認証システムと連携
    createdAt: formattedDate
};

// コメント一覧に追加
setComments([...comments, newCommentObj]);

// 入力フィールドをクリア
setNewComment("");
};

return (
<>
    {/* 戻るボタン */}
        <div className="flex justify-center mb-4">
            {/* <Link href={returnUrl}>
                <Button variant="outline" className="bg-[#2B2B2B] border-[#555] text-[#F9F9F9] hover:bg-[#3B3B3B]">
                    ← 検索結果に戻る
                </Button>
            </Link> */}
        </div>
    {/* 投稿詳細カード */}
    <div className="flex justify-center">
    <Card className="bg-[#2B2B2B] p-6 w-full max-w-xl">
        <CardContent className="space-y-6 relative pb-8">
            <h2 className="text-xl font-semibold text-[#F9F9F9]">{setting.gameTitle} - {setting.character}({setting.role})</h2>
            <p className="text-[#BBBBBB] text-sm">FPS歴：{setting.fpsExperience}</p>

            {/* 設定テーブル */}
            <table className="w-full border-collapse mt-4">
                <tbody>
                {/* 共通設定 */}
                <tr>
                    <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">DPI</th>
                    <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{setting.dpi}</td>
                    <th className="border-b border-[#BBBBBB] p-2 text-left text-[#F9F9F9]">デバイス</th>
                    <td className="border-b border-[#BBBBBB] p-2 text-[#BBBBBB]">{setting.device}</td>
                </tr>

                {/* ゲーム固有設定 */}
                <GameSpecificSettings setting={setting} />
                </tbody>
            </table>

            {/* 投稿者コメント */}
            <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                <span>📝</span>
                <h3 className="text-lg font-semibold text-[#F9F9F9]">投稿者コメント</h3>
                </div>
                <p className="text-[#BBBBBB] text-sm">{setting.comment || "コメントはありません"}</p>
            </div>
            <div className="absolute bottom-0 left-0 text-xs text-[#888888]">
                投稿日: {setting.createdAt}
            </div>
        </CardContent>
    </Card>
    </div>
        <CommentsSection settingId={settingId} />
</>
);
}
