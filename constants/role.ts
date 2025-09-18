import { gameFields } from "@/constants/gameFields";

// roleのvalueからlabelに変換する関数
export const getRoleLabel = (gameTitle: string, roleValue: string): string => {
  const game = gameFields[gameTitle];
  if (!game) return roleValue;

  const role = game.roles.find((r) => r.value === roleValue);
  return role ? role.label : roleValue;
};
