"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";


import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { deviceOptions } from "@/constants/device";
import { dpiOptions } from "@/constants/dpi";
import { fpsExperienceOptions } from "@/constants/fpsExperience";
import { gameFields } from "@/constants/gameFields";
import { createSetting } from "@/lib/services/settings";
import { GameFields } from "@/types/type";

export default function Post() {
  // string で十分。keyof GameFields は number を含むため payload 型と不一致になっていた
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedRoles, setSelectedRoles] = useState<string>("");
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>({});
  const [fpsExperience, setFpsExperience] = useState<string>("");
  const [dpi, setDpi] = useState<number>(0);
  const [device, setDevice] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [specificSelectValues, setSpecificSelectValues] = useState<{ [key: string]: string }>({});
  const [comment, setComment] = useState<string>("");
  const router = useRouter();

  // TODO: 型定義は別の場所でやるべき
  type ApiResponse = { ok: boolean; id?: number; errors?: string };

  // TODO: ゲームタイトルは型で管理している？Constantsでまとめた方がよいかもしれない
  //ゲームタイトルごとに項目を更新
  const handleGameChange = (value: string) => {
    setSelectedGame(value);
    setSelectedRoles("");
  };

  //スライダーの値を更新
  const handleSliderChange = (value: number[], fieldLabel: string) => {
    setSliderValues((prev) => ({
      ...prev,
      [fieldLabel]: value[0],
    }));
  };

  // TODO:必須項目と記載されているところのみ入力すると404エラーが出る(GET処理でエラーが出てそうなので放置)
  const handleSubmit = async () => {
    if (!selectedGame || !fpsExperience || !selectedRoles) {
      alert("必須項目を入力してください");
      router.push("/post");
      return;
    }

    const data = {
      game: selectedGame,
      fpsExperience,
      role: selectedRoles,
      character: selectedCharacter,
      dpi,
      device,
      comment,
      sliders: sliderValues,
      selects: specificSelectValues,
    };

    console.log("data", data);

    try {
      const result = (await createSetting(data)) as ApiResponse;
      console.log("result", result);
      if (result.ok && result.id) {
        console.log("resultかidが取得できる", result.id);
        router.push(`/settings/${result.id}`);
      } else {
        console.log("resultかidが取得できない", result.errors);
        alert(result.errors);
        router.push("/");
      }
    } catch (e) {
      console.error("エラーが発生しました", e);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 text-[var(--color-text)]">
      {/* 投稿フォーム */}
      <div className="container mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center">
        <section className="w-full max-w-xl rounded-xl bg-[var(--color-surface)] p-6">
          <div className="mb-6 grid grid-cols-1 gap-6">
            {/* 基本事項 */}
            <Select onValueChange={handleGameChange}>
              <SelectTrigger className="w-full bg-[var(--color-bg)] text-center">
                <SelectValue placeholder="ゲームタイトル選択 (必須)" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(gameFields).map((game) => (
                  <SelectItem key={game} value={game}>
                    {game}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setFpsExperience} value={fpsExperience}>
              <SelectTrigger className="w-full bg-[var(--color-bg)] text-center">
                <SelectValue placeholder="FPS歴選択 (必須)" />
              </SelectTrigger>
              <SelectContent>
                {fpsExperienceOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setDpi(Number(value))} value={dpi.toString()}>
              <SelectTrigger className="w-full bg-[var(--color-bg)] text-center">
                <SelectValue placeholder="マウスDPI (必須)" />
              </SelectTrigger>
              <SelectContent>
                {dpiOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value.toString()}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setDevice} value={device}>
              <SelectTrigger className="w-full bg-[var(--color-bg)] text-center">
                <SelectValue placeholder="デバイス" />
              </SelectTrigger>
              <SelectContent>
                {deviceOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedGame && (
              <>
                <Select onValueChange={setSelectedRoles} value={selectedRoles}>
                    <SelectTrigger className="w-full bg-[var(--color-bg)] text-center">
                    <SelectValue placeholder="ロール選択 (必須)" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameFields[selectedGame].roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedRoles && (
                  <Select onValueChange={setSelectedCharacter} value={selectedCharacter}>
                    <SelectTrigger className="w-full bg-[var(--color-bg)] text-center">
                      <SelectValue placeholder="キャラクター選択 (必須)" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameFields[selectedGame].characters[selectedRoles].map((character) => (
                        <SelectItem key={character} value={character}>
                          {character}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {/* スライダー部分のUI修正必要 */}
                {gameFields[selectedGame].specificFields.map((field, index) => {
                  if (field.type === "slider") {
                    return (
                      <div key={index}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-gray-400">{field.min}</span>
                          <label className="text-center">{field.label}</label>
                          <span className="text-sm text-blue-400">
                            {sliderValues[field.label]?.toFixed(2) ?? field.min?.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400">{field.max}</span>
                        </div>
                        <Slider
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          defaultValue={[field.min ?? 0]}
                          onValueChange={(value) => handleSliderChange(value, field.label)}
                          className="[&>[role=slider]]:bg-[var(--color-accent)] [&_[data-orientation=horizontal]]:bg-[var(--color-bg)] [&_[data-orientation=horizontal]_.range]:bg-[var(--color-accent)] [&_[role=slider]]:border-[var(--color-accent)] [&_[role=slider]]:bg-[var(--color-accent)] [&_[role=slider]]:shadow-[var(--color-accent)]"
                        />
                      </div>
                    );
                  }
                  if (field.type === "select") {
                    return (
                      <Select
                        key={index}
                        onValueChange={(value) =>
                          setSpecificSelectValues((prev) => ({ ...prev, [field.label]: value }))
                        }
                        value={specificSelectValues[field.label] || ""}
                      >
                    <SelectTrigger className="w-full bg-[var(--color-bg)] text-center">
                          <SelectValue placeholder={field.label} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }
                })}
              </>
            )}
          </div>

          <div className="mb-6">
            <Textarea
              placeholder="一言コメント (任意)"
              className="min-h-[100px] w-full bg-[var(--color-bg)]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <Link href="/">
            <div className="flex justify-center">
              <Button
                className="rounded-full bg-[var(--color-accent)] px-10 py-3 text-black hover:bg-[var(--color-accent-hover)]"
                onClick={handleSubmit}
              >
                投稿する
              </Button>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
