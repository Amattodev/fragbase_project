"use client";

import FilterArea from "@/components/FilterArea";
import SettingCard from "@/components/SettingCard";
import ServiceMessage from "@/components/ServiceMessage";
import { useSettingSearch } from "@/features/settings/useSettingSearch";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const searchHook = useSettingSearch();

  useEffect(() => {
    //urlクエリパラメータから検索条件を復元
    const filters = {
      game: searchParams.get("game") || undefined,
      role: searchParams.get("role") || undefined,
      character: searchParams.get("character") || undefined,
      fpsExperience: searchParams.get("fpsExperience") || undefined,
    };

    // 検索条件がある場合は条件付き検索、なければ全件取得
    const hasFilters = Object.values(filters).some((value) => value);
    if (hasFilters) {
      searchHook.setFilters(filters);
      searchHook.searchSettings(filters);
    } else {
      searchHook.searchSettings();
    }
  }, [searchParams]);

  return (
    <>
      {/* サービスメッセージ */}
      <ServiceMessage />

      {/* フィルター検索エリア */}
      <FilterArea searchHook={searchHook} />

      {/* 新着設定一覧 */}
      <SettingCard searchHook={searchHook} />

      {/* TODO 0704 診断コンテンツが必要な時に追加する */}
      {/* 診断コンテンツバナー */}
      {/* <section className="flex justify-center">
        <div className="bg-[#2B2B2B] p-6 rounded-xl text-center w-full ">
          <h2 className="text-xl font-semibold mb-4">自分に合ったFPS設定を診断しよう！</h2>
          <div className="flex justify-center">
            <Button className="bg-[#7DB7E8] hover:bg-[#6AA7D8] text-black px-10 py-3 rounded-full">診断をはじめる</Button>
          </div>
        </div>
      </section> */}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
