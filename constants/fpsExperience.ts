// TODO: valueをid化した方が良い？
export const fpsExperienceOptions = [
    { value: "less_than_half", label: "半年未満" },
    { value: "less_than_one", label: "1年未満" },
    { value: "more_than_three", label: "3年以上" },
];

// 表示用ラベル取得関数
export const getFpsExperienceLabel = (value: string): string => {
const found = fpsExperienceOptions.find((opt) => opt.value === value);
return found ? found.label : value;
};
