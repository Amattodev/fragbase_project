'use client';
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gameFields } from "@/types/gameFields";
import { fpsExperienceOptions } from "@/constants/fpsExperience";
import { UseSettingsSearchReturn } from "@/features/settings/useSettingSearch";

interface FilterAreaProps {
    searchHook: UseSettingsSearchReturn;
}

export default function FilterArea({ searchHook }: FilterAreaProps) {
    const { filters, setFilter, setFilters, searchSettings, resetPagination } = searchHook;
    const router = useRouter();
    const searchParams = useSearchParams();

    // ローカル状態（UIの即座な反応のため）
    const [selectedGame, setSelectedGame] = useState<string>(filters.game || '');
    const [selectedRole, setSelectedRole] = useState<string>(filters.role || '');
    const [selectedCharacter, setSelectedCharacter] = useState<string>(filters.character || '');
    const [selectedFpsExperience, setSelectedFpsExperience] = useState<string>(filters.fpsExperience || '');

    //filtersが変更されたときにローカル状態を更新
    useEffect(() => {
        setSelectedGame(filters.game || '');
        setSelectedRole(filters.role || '');
        setSelectedCharacter(filters.character || '');
        setSelectedFpsExperience(filters.fpsExperience || '');
    }, [filters]);

    //選択を変更した際のリセット処理
    const handleGameChange = (game: string) => {
        setSelectedGame(game);
        setSelectedRole('');
        setSelectedCharacter('');
    }

    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        setSelectedCharacter('');
    }

    const getAllCharacters = (gameTitle: string) => {
        if (!gameFields[gameTitle]) return [];

        const characters = gameFields[gameTitle].characters;
        const allCharacters: string[] = [];

        Object.values(characters).forEach(roleCharacters => {
            allCharacters.push(...roleCharacters);
        });
        return [...new Set(allCharacters)].sort();
    }

    const handleSearch = async () => {
        const filters = {
            game: selectedGame || undefined,
            fpsExperience: selectedFpsExperience || undefined,
            role: selectedRole || undefined,
            character: selectedCharacter || undefined,
        };

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });

        const queryString = params.toString();
        const newUrl = queryString ? `/?${queryString}` : '/';
        router.push(newUrl);

        resetPagination();
        setFilters(filters);
        await searchSettings(filters);
    }

    // return (
    //     <div className="flex justify-center">
    //         <section className="bg-[#2B2B2B] p-6 rounded-xl w-full max-w-3xl mb-6">
    //             <div className="flex flex-wrap gap-4 mb-4">
    //             <Select value={selectedGame} onValueChange={handleGameChange}>
    //                     <SelectTrigger className="bg-[#1F1F1F] flex-1 min-w-[150px]">
    //                         <SelectValue placeholder="ゲームタイトル" />
    //                     </SelectTrigger>
    //                     <SelectContent>
    //                         <SelectItem value="APEX">APEX</SelectItem>
    //                         <SelectItem value="VALORANT">VALORANT</SelectItem>
    //                         <SelectItem value="OVERWATCH2">OVERWATCH2</SelectItem>
    //                     </SelectContent>
    //                 </Select>

    //                 <Select value={selectedFpsExperience} onValueChange={setSelectedFpsExperience}>
    //                     <SelectTrigger className="bg-[#1F1F1F] flex-1 min-w-[150px]">
    //                         <SelectValue placeholder="FPS歴" />
    //                     </SelectTrigger>
    //                     <SelectContent>
    //                         {fpsExperienceOptions.map((option) => (
    //                             <SelectItem key={option.value} value={option.value}>
    //                                 {option.label}
    //                             </SelectItem>
    //                         ))}
    //                     </SelectContent>
    //                 </Select>

    //                 <Select
    //                     value={selectedRole}
    //                     onValueChange={handleRoleChange}
    //                 >
    //                     <SelectTrigger className="bg-[#1F1F1F] flex-1 min-w-[150px]">
    //                         <SelectValue placeholder="ロール" />
    //                     </SelectTrigger>
    //                     <SelectContent>
    //                         {selectedGame && gameFields[selectedGame]?.roles.map((role) => (
    //                             <SelectItem key={role.value} value={role.value}>
    //                                 {role.label}
    //                             </SelectItem>
    //                         ))}
    //                     </SelectContent>
    //                 </Select>

    //                 <Select
    //                     value={selectedCharacter}
    //                     onValueChange={setSelectedCharacter}
    //                 >
    //                     <SelectTrigger className="bg-[#1F1F1F] flex-1 min-w-[150px]">
    //                         <SelectValue placeholder="キャラクター" />
    //                     </SelectTrigger>
    //                     <SelectContent>
    //                         {selectedGame && getAllCharacters(selectedGame).map((character) => (
    //                             <SelectItem key={character} value={character}>
    //                                 {character}
    //                             </SelectItem>
    //                         ))}
    //                     </SelectContent>
    //                 </Select>
    //             </div>
    //             <div className="flex justify-center gap-4">
    //                 <Button
    //                     onClick={handleSearch}
    //                     className="bg-[#FFD580] hover:bg-[#FFCB70] text-black px-10 py-3 rounded-full"
    //                 >
    //                     この条件で検索する
    //                 </Button>
    //             </div>
    //         </section>
    //     </div>

    // )
}
