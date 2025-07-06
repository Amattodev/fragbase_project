'use client';
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { getFpsExperienceLabel } from "@/constants/fpsExperience";
import { getDpiLabel } from "@/constants/dpi";
import { getDeviceLabel } from "@/constants/device";
import { UseSettingsSearchReturn } from "@/features/settings/useSettingSearch";
interface SettingCardProps {
    searchHook: UseSettingsSearchReturn;
}

export default function SettingCard({ searchHook }: SettingCardProps) {
    const { filters, settings, loading, error, hasMore, loadMore } = searchHook;
    const searchParams = useSearchParams();

    if (loading && settings.length === 0) {
        // return (
        //     // <section className="mb-6 flex flex-col items-center">
        //     //     <p>Loading...</p>
        //     // </section>
        // )
    }

    if (error) {
        return (
            <section className="mb-6 flex flex-col items-center">
                <p className="text-red-500">{error}</p>
            </section>
        )
    }

    const hasActiveFilters = Object.values(filters).some(v => v);


    return (
        <section className="mb-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">
                {Object.values(filters).some(v => v) ? "検索結果" : "新着設定一覧"}
            </h2>
            <div className="flex flex-col items-center gap-4">
                {settings && settings.length > 0 ? (
                    <>
                        {settings.map((setting) => (
                            <Link
                                key={setting.id}
                                href={`/settings/${setting.id}?returnUrl=${encodeURIComponent(`/?${searchParams.toString()}`)}`}
                                className="w-full max-w-3xl relative"
                        >
                            <Card className="bg-[#2B2B2B] w-full max-w-3xl">
                                <CardContent className="p-4 ">
                                    <h3 className="text-lg font-semibold text-[#F9F9F9]"> {setting.gameTitle} / {setting.character} / {getFpsExperienceLabel(setting.fpsExperience)}</h3>
                                    <p className="text-[#BBBBBB] text-sm">ゲーム内感度：{setting.sensitivity} / DPI：{getDpiLabel(setting.dpi)} / デバイス：{getDeviceLabel(setting.device)}</p>
                                    <div className="absolute bottom-2 right-3 text-xs text-[#666666]">
                                        {setting.createdAt}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        ))}
                    {hasMore && (
                        <div className="flex justify-center">
                            <span
                                onClick={loadMore}
                                className={`mt-4 text-[#4A90E2] cursor-pointer hover:text-[#357ABD] transition-colors duration-200 ${
                                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:underline'
                                }`}
                                style={{
                                    pointerEvents: loading ? 'none' : 'auto'
                                }}
                            >
                                {loading ? '読み込み中...' : 'もっと読み込む'}
                            </span>
                        </div>
                    )}
                </>
                ) : (
                    <p>{Object.values(filters).some(v => v) ? "検索条件に一致する設定が見つかりません" : "設定が見つかりません"}</p>
                )}
            </div>
        </section>

    )
}
