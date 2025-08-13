"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EditorComponent from "@/components/Editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState({
    title: "",
    content: "",
  });

  const articleId = params.id as string;

  // 記事データの取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${articleId}`);
        const data = (await res.json()) as ApiResponse;

        if (data.ok && data.post) {
          setPost(data.post);
          setTitle(data.post.title);
          setContent(data.post.content);
          setOriginalContent({
            title: data.post.title,
            content: data.post.content,
          });
          setHasUnsavedChanges(false);
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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(
      newTitle !== originalContent.title || content !== originalContent.content
    );
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(
      title !== originalContent.title || newContent !== originalContent.content
    );
  };

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

      const data = (await res.json()) as ApiResponse;
      if (data.ok && data.post) {
        console.log("保存成功");
        setPost(data.post);
        setOriginalContent({ title, content });
        setHasUnsavedChanges(false);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "未保存の変更があります。本当にページを離れますか？";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
            {hasUnsavedChanges && (
              <div className="flex items-center text-sm text-[#FF6B6B]">
                <span className="inline-block w-2 h-2 bg-[#FF6B6B] rounded-full mr-2 animate-pulse"></span>
                未保存
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`${
                hasUnsavedChanges && !saving
                  ? "bg-[#FF6B6B] text-white hover:bg-[#FF5252] animate-pulse"
                  : "bg-[#7DB7E8] text-black hover:bg-[#6AA3D5]"
              }`}
            >
              {saving ? "保存中..." : hasUnsavedChanges ? "未保存" : "保存"}
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
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="記事のタイトルを入力..."
                className={`bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] ${
                  hasUnsavedChanges ? "border-[#FF6B6B]" : ""
                }`}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                本文（Markdown）
              </label>
              <div className="h-[calc(100vh-240px)]">
                <EditorComponent
                  content={content}
                  onChange={handleContentChange}
                  onSave={handleSave}
                  hasUnsavedChanges={hasUnsavedChanges}
                />
              </div>
            </div>
          </div>

          {/* プレビュー部分 */}
          <div className="bg-[#2B2B2B] rounded-lg p-4 overflow-auto">
            <h3 className="text-lg font-semibold mb-4">プレビュー</h3>
            <div className="prose prose-invert max-w-none">
              <h1 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">
                {title || "タイトルなし"}
              </h1>
              <div className="mt-4 prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // カスタムコンポーネントでスタイリング
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mt-6 mb-4 text-[#F5F5F5]">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold mt-5 mb-3 text-[#F5F5F5]">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-medium mt-4 mb-2 text-[#F5F5F5]">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-[#E5E5E5] leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 mb-4 text-[#E5E5E5]">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-4 text-[#E5E5E5]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[#7DB7E8] pl-4 italic text-[#D0D0D0] my-4">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="bg-[#1F1F1F] text-[#7DB7E8] px-1 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-[#1F1F1F] text-[#F5F5F5] p-3 rounded-lg overflow-x-auto">
                          {children}
                        </code>
                      ),
                    pre: ({ children }) => (
                      <pre className="bg-[#1F1F1F] p-4 rounded-lg overflow-x-auto mb-4">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-[#7DB7E8] hover:text-[#6AA3D5] underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt}
                        className="max-w-full h-auto rounded-lg my-4"
                      />
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border border-gray-600">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-600 px-4 py-2 bg-[#1F1F1F] text-[#F5F5F5] font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-600 px-4 py-2 text-[#E5E5E5]">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {content || "*プレビューするコンテンツがありません*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
