export const deviceOptions = [
  { value: "mouse_keyboard", label: "キーボード・マウス" },
  { value: "controller", label: "コントローラー" },
];

// 表示用ラベル取得関数
export const getDeviceLabel = (value: string): string => {
  const found = deviceOptions.find((opt) => opt.value === value);
  return found ? found.label : value;
};
