"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EditorComponent from "@/components/Editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Post {
  id: number;
  title: string;
  content: string;
  status: string;
  slug: string;
}

interface ApiResponse {
  ok: boolean;
  post?: Post;
  error?: string;
}

export default function ArticleEditPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const articleId = params.id as string;

  // 記事データの取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${articleId}`);
        const data = await res.json() as ApiResponse;
        
        if (data.ok && data.post) {
          setPost(data.post);
          setTitle(data.post.title);
          setContent(data.post.content);
        } else {
          console.error("記事の取得に失敗:", data.error);
          router.push("/");
        }
      } catch (error) {
        console.error("記事取得エラー:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchPost();
    }
  }, [articleId, router]);

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!post || saving) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      const data = await res.json() as ApiResponse;
      if (data.ok && data.post) {
        console.log("保存成功");
        setPost(data.post);
      } else {
        console.error("保存失敗:", data.error);
        alert("保存に失敗しました");
      }
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [post, title, content, saving]);

  // プレビューページへ遷移
  const handlePreview = () => {
    if (post) {
      window.open(`/articles/${post.id}/${post.slug}`, "_blank");
    }
  };

  // ホームに戻る
  const handleGoHome = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5] flex items-center justify-center">
        <div>記事を読み込み中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5] flex items-center justify-center">
        <div>記事が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-[#F5F5F5]">
      {/* ヘッダー */}
      <div className="border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleGoHome}
              variant="outline"
              size="sm"
              className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
            >
              ← ホーム
            </Button>
            <h1 className="text-xl font-bold">記事編集</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePreview}
              variant="outline"
              size="sm"
              className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
            >
              プレビュー
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#7DB7E8] text-black hover:bg-[#6AA3D5]"
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          {/* エディタ部分 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">タイトル</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="記事のタイトルを入力..."
                className="bg-[#2B2B2B] border-gray-600 text-[#F5F5F5]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">本文（Markdown）</label>
              <div className="h-[calc(100vh-240px)]">
                <EditorComponent
                  content={content}
                  onChange={setContent}
                  onSave={handleSave}
                />
              </div>
            </div>
          </div>

          {/* プレビュー部分 */}
          <div className="bg-[#2B2B2B] rounded-lg p-4 overflow-auto">
            <h3 className="text-lg font-semibold mb-4">プレビュー</h3>
            <div className="prose prose-invert max-w-none">
              <h1 className="text-2xl font-bold mb-4">{title || "タイトルなし"}</h1>
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}