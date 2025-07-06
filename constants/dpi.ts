export const dpiOptions = [
    { value: 400, label: "400" },
    { value: 800, label: "800" },
    { value: 1600, label: "1600" },
    { value: 3200, label: "3200" },
    { value: 6400, label: "6400" },
];

// 表示用ラベル取得関数
export const getDpiLabel = (value: number): string => {
    const found = dpiOptions.find((opt) => opt.value === value);
    return found ? found.label : value.toString();
};
