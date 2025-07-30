import { useState, useCallback } from "react";
import { GameSetting } from "@/types/type";

// 検索条件の型定義
export interface SearchFilters {
  game?: string;
  role?: string;
  character?: string;
  fpsExperience?: string;
}

type Pagination = {
  limit: number;
  offset: number;
  hasMore: boolean;
  currentPage: number;
};

// API レスポンスの型定義
type ApiResponse = {
  ok: boolean;
  data: GameSetting[];
  pagination: Pagination;
  error?: string;
};

const LIMIT = 5;

// 返り値の型定義
export interface UseSettingsSearchReturn {
  filters: SearchFilters;
  settings: GameSetting[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;

  setFilter: (key: keyof SearchFilters, value: string | undefined) => void;
  setFilters: (newFilters: SearchFilters) => void;
  searchSettings: (overrideFilters?: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  resetPagination: () => void;
  refetch: () => Promise<void>;
}

export const useSettingSearch = (): UseSettingsSearchReturn => {
  const [filters, setFiltersState] = useState<SearchFilters>({});
  const [settings, setSettings] = useState<GameSetting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  //ページネーションのリセット
  const resetPagination = useCallback(() => {
    setOffset(0);
    setHasMore(false);
    setSettings([]);
  }, []);

  //フィルタの更新
  const setFilter = useCallback(
    (key: keyof SearchFilters, value: string | undefined) => {
      setFiltersState((prev) => ({
        ...prev,
        [key]: value,
      }));
      resetPagination();
    },
    [resetPagination]
  );

  const setFilters = useCallback(
    (newFilters: SearchFilters) => {
      setFiltersState(newFilters);
      resetPagination();
    },
    [resetPagination]
  );

  //APIからのデータを取得する
  const searchSettings = useCallback(
    async (overrideFilters?: SearchFilters) => {
      setLoading(true);
      setError(null);

      try {
        const filtersToUse = overrideFilters || filters;

        const params = new URLSearchParams();
        Object.entries(filtersToUse).forEach(([key, value]) => {
          if (value && value.trim() !== "") {
            params.append(key, value);
          }
        });

        params.append("limit", LIMIT.toString());
        params.append("offset", "0");

        const queryString = params.toString();
        const url = queryString
          ? `/api/settings?${queryString}`
          : "/api/settings";
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("HTTPリクエストに失敗しました");
        }

        const json = (await response.json()) as ApiResponse;

        if (!json.ok) {
          throw new Error(json.error || "データの取得に失敗しました");
        }

        setSettings(json.data || []);
        setHasMore(json.pagination?.hasMore || false);
        setOffset(LIMIT);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "不明なエラーが発生しました";
        setError(errorMessage);
        setSettings([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          params.append(key, value);
        }
      });

      // ページネーション用のパラメータを追加
      params.append("limit", LIMIT.toString());
      params.append("offset", offset.toString());

      const queryString = params.toString();
      const url = `/api/settings?${queryString}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("に失敗しました");
      }

      const json = (await response.json()) as ApiResponse;

      if (!json.ok) {
        throw new Error(json.error || "データの取得に失敗しました");
      }

      // 既存のデータに新しいデータを追加
      setSettings((prev) => [...prev, ...(json.data || [])]);
      setHasMore(json.pagination?.hasMore || false);
      setOffset((prev) => prev + LIMIT); // 次回のoffsetを更新
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, offset, hasMore, loading]);

  // リフェッチ用の関数（現在のフィルタで再検索）
  const refetch = useCallback(async () => {
    resetPagination();
    await searchSettings();
  }, [searchSettings, resetPagination]);

  //データを再取得する
  return {
    filters,
    settings,
    loading,
    error,
    hasMore,

    setFilter,
    setFilters,
    searchSettings,
    loadMore,
    resetPagination,
    refetch,
  };
};
