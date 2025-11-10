"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import MultiSelect from "@/components/MultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPost, searchTags, updatePost as updatePostService, deletePost as deletePostService } from "@/lib/services/posts";
import { getGamesCatalog } from "@/lib/services/games/catalog";
import type { Post } from "@/lib/services/posts";

import EditorComponent from "../../_components/Editor";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [originalContent, setOriginalContent] = useState({
    title: "",
    content: "",
    status: "draft" as "draft" | "published",
    tags: [] as string[],
    gameCategories: [] as string[],
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<{ id: number; name: string }[]>([]);
  // ゲーム選択は slug ベース
  const [gameSlugs, setGameSlugs] = useState<string[]>([]);
  const [availableGames, setAvailableGames] = useState<{ id: number; name: string; displayName: string }[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const articleId = params.id as string;

  // 記事データの取得
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPost(articleId);
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setStatus(data.status as "draft" | "published");
        setTags(data.tags?.map((tag) => tag.name) || []);
        // 初期は名前ベース。後で games カタログに合わせて slug へ変換
        const initialNames = data.gameCategories?.map((gc) => gc.name) || [];
        setGameSlugs(initialNames); // 一旦保持（変換はカタログ取得後）
        setOriginalContent({
          title: data.title,
          content: data.content,
          status: data.status as "published" | "draft",
          tags: data.tags?.map((tag) => tag.name) || [],
          gameCategories: initialNames,
        });
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("記事取得エラー:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      load();
    }
  }, [articleId, router]);

  // ゲーム一覧の取得（constants/games.ts をソースとする）
  useEffect(() => {
    const loadGames = async () => {
      try {
        const games = await getGamesCatalog();
        // MultiSelect の Option 形式に変換（value=name=slug, displayName=label）
        const opts = games.map((g, idx) => ({ id: idx + 1, name: g.slug, displayName: g.name }));
        setAvailableGames(opts);
      } catch (error) {
        console.error("ゲーム一覧取得エラー:", error);
      }
    };
    loadGames();
  }, []);

  // カタログ取得後、既存の name 群を slug に変換
  useEffect(() => {
    if (availableGames.length === 0 || gameSlugs.length === 0) return;
    // 既に slug の形（/ を含まない英小文字-連結）ならそのまま、そうでなければ name->slug 変換
    const toSlug = (val: string) => {
      // 候補: displayName一致 → そのslug、なければそのまま
      const hit = availableGames.find((g) => g.displayName.toLowerCase() === val.toLowerCase());
      return hit ? hit.name : val;
    };
    setGameSlugs((prev) => prev.map(toSlug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableGames.length]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(
      newTitle !== originalContent.title ||
        content !== originalContent.content ||
        status !== originalContent.status ||
        JSON.stringify(tags) !== JSON.stringify(originalContent.tags) ||
        JSON.stringify(gameSlugs) !== JSON.stringify(originalContent.gameCategories),
    );
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(
      title !== originalContent.title ||
        newContent !== originalContent.content ||
        status !== originalContent.status ||
        JSON.stringify(tags) !== JSON.stringify(originalContent.tags) ||
        JSON.stringify(gameSlugs) !== JSON.stringify(originalContent.gameCategories),
    );
  };

  const handleStatusChange = (newStatus: "draft" | "published") => {
    setStatus(newStatus);
    setHasUnsavedChanges(
      title !== originalContent.title ||
        content !== originalContent.content ||
        newStatus !== originalContent.status ||
        JSON.stringify(tags) !== JSON.stringify(originalContent.tags) ||
        JSON.stringify(gameSlugs) !== JSON.stringify(originalContent.gameCategories),
    );
  };

  const handleTagAdd = (tagName: string) => {
    if (tags.length >= 5) {
      alert("タグは最大5つまでです");
      return;
    }

    if (!tags.includes(tagName) && tagName.trim() !== "") {
      setTags([...tags, tagName]);
      setTagInput("");
      setTagSuggestions([]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputChange = async (value: string) => {
    setTagInput(value);
    console.log("タグ入力:", value);

    if (value.trim().length > 0) {
      try {
        const tags = await searchTags(value);
        setTagSuggestions(tags);
      } catch (error) {
        console.error("タグの検索エラー:", error);
      }
    } else {
      setTagSuggestions([]);
    }
  };

  const handleGameSlugsChange = (newSlugs: string[]) => {
    setGameSlugs(newSlugs);
    setHasUnsavedChanges(
      title !== originalContent.title ||
        content !== originalContent.content ||
        JSON.stringify(tags) !== JSON.stringify(originalContent.tags) ||
        JSON.stringify(newSlugs) !== JSON.stringify(originalContent.gameCategories),
    );
  };

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!post || saving) return;

    setSaving(true);
    try {
      const data = await updatePostService(post.id, {
        title,
        content,
        status,
        tags,
        gameSlugs,
      });
      if (data) {
        console.log("保存成功");
        setPost(data);
        // 保存後の比較用に、originalContent 側も slug ベースで保持
        setOriginalContent({ title, content, status, tags, gameCategories: gameSlugs });
        setHasUnsavedChanges(false);
      } else {
        alert("保存に失敗しました");
      }
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [post, title, content, tags, gameSlugs, status, saving]);

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
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ホームに戻る
  const handleGoHome = () => {
    router.push("/");
  };

  // 記事削除処理
  const handleDelete = async () => {
    if (!post || deleting) return;

    setDeleting(true);
    try {
      await deletePostService(post.id);
      {
        console.log("記事が削除されました");
        router.push("/");
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // 削除ダイアログを開く
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div>記事を読み込み中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div>記事が見つかりません</div>
      </div>
    );
  }

  //動画埋め込み処理
  const VideoEmbedComponent = ({ text }: { text: string }) => {
    const youtubeMatch = text.match(/\[youtube:([^\]]+)\]/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return (
        <div className="my-6">
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg shadow-lg"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* ヘッダー */}
      <div className="border-b border-gray-700 p-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGoHome}
              variant="outline"
              size="sm"
              className="border-gray-600 bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            >
              ← ホーム
            </Button>
            <h1 className="text-xl font-bold">記事編集</h1>
            {hasUnsavedChanges && (
              <div className="flex items-center text-sm text-[var(--color-danger)]">
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-danger)]"></span>
                未保存
              </div>
            )}
          </div>
          {/* <div className="flex items-center gap-2">
          </div> */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--color-text)]">
                {status === "published" ? "公開中" : "下書き"}
              </label>
              <button
                onClick={() => handleStatusChange(status === "draft" ? "published" : "draft")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  status === "published" ? "bg-[var(--color-accent)]" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    status === "published" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <Button
              onClick={handleDeleteClick}
              variant="outline"
              size="sm"
              className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700"
            >
              削除
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`${
                hasUnsavedChanges && !saving
                  ? "animate-pulse bg-[var(--color-danger)] text-white hover:brightness-110"
                  : status === "published"
                    ? "bg-[var(--color-success)] text-white hover:brightness-110"
                    : "bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]"
              }`}
            >
              {saving
                ? "保存中..."
                : hasUnsavedChanges
                  ? "未保存"
                  : status === "published"
                    ? "公開中"
                    : "下書き保存"}
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-6xl p-4">
        <div className="grid h-[calc(100vh-120px)] grid-cols-1 gap-6 lg:grid-cols-2">
          {/* エディタ部分 */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">タイトル</label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="記事のタイトルを入力..."
                className={`border-gray-600 bg-[var(--color-surface)] text-[var(--color-text)] ${
                  hasUnsavedChanges ? "border-[var(--color-danger)]" : ""
                }`}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">タグ（最大5個）</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-2 py-1 text-sm text-black"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-xs hover:bg-black hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {tags.length < 5 && (
                <div className="relative">
                  <Input
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTagAdd(tagInput);
                      }
                    }}
                    placeholder="タグを入力してEnter"
                    className="border-gray-600 bg-[var(--color-surface)] text-[var(--color-text)]"
                  />

                  {/* タグ候補を表示 */}
                  {tagSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-600 bg-[var(--color-surface)]">
                      {tagSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleTagAdd(suggestion.name)}
                          className="block w-full px-3 py-2 text-left text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                        >
                          {suggestion.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">ゲームタイトル（複数選択可）</label>
              <MultiSelect
                options={availableGames}
                selectedValues={gameSlugs}
                onChange={handleGameSlugsChange}
                placeholder="ゲームタイトルを選択"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">本文（Markdown）</label>
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
          <div className="overflow-auto rounded-lg bg-[var(--color-surface)] p-4">
            <h3 className="mb-4 text-lg font-semibold">プレビュー</h3>
            <div className="prose prose-invert max-w-none">
              <h1 className="mb-4 border-b border-gray-600 pb-2 text-2xl font-bold">
                {title || "タイトルなし"}
              </h1>
              <div className="prose prose-invert mt-4 max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // カスタムコンポーネントでスタイリング
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-6 text-2xl font-bold text-[var(--color-text)]">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-5 text-xl font-semibold text-[var(--color-text)]">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-4 text-lg font-medium text-[var(--color-text)]">{children}</h3>
                    ),
                    p: ({ children }) => {
                      const text = React.Children.toArray(children).join("");

                      if (text.match(/\[(youtube|vimeo|tiktok):[^\]]+\]/)) {
                        return <VideoEmbedComponent text={text} />;
                      }

                      return <p className="mb-4 leading-relaxed text-[var(--color-subtle-text)]">{children}</p>;
                    },
                    ul: ({ children }) => (
                      <ul className="mb-4 list-disc pl-6 text-[var(--color-subtle-text)]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 list-decimal pl-6 text-[var(--color-subtle-text)]">{children}</ol>
                    ),
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-[var(--color-accent)] pl-4 italic text-[#D0D0D0]">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, ...props }) => {
                      const isInline =
                        props.className?.includes("inline") ||
                        !props.className?.includes("language-");
                      return isInline ? (
                        <code className="rounded bg-[var(--color-bg)] px-1 py-0.5 text-sm text-[var(--color-accent)]">
                          {children}
                        </code>
                      ) : (
                        <code className="block overflow-x-auto rounded-lg bg-[var(--color-bg)] p-3 text-[var(--color-text)]">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="mb-4 overflow-x-auto rounded-lg bg-[var(--color-bg)] p-4">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)]"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    img: ({ src, alt }) => {
                      // 動画ファイルかどうかをチェック
                      const isVideo =
                        src && typeof src === "string" && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src);

                      if (isVideo) {
                        return (
                          <video
                            src={src}
                            className="my-4 h-auto max-w-full rounded-lg"
                            controls
                            preload="metadata"
                          >
                            {alt && <p>{alt}</p>}
                          </video>
                        );
                      }

                      return (
                        <img src={src} alt={alt} className="my-4 h-auto max-w-full rounded-lg" />
                      );
                    },
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto">
                        <table className="min-w-full border border-gray-600">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-600 bg-[var(--color-bg)] px-4 py-2 font-semibold text-[var(--color-text)]">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-600 px-4 py-2 text-[var(--color-subtle-text)]">
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

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg border border-gray-600 bg-[var(--color-surface)] p-6">
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">記事を削除</h3>
            <p className="mb-6 text-[var(--color-subtle-text)]">
              本当にこの記事を削除しますか？
              <br />
              この操作は取り消すことができません。
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteDialog(false)}
                variant="outline"
                className="border-gray-600 bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                disabled={deleting}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
