// 基本の共通フィールド
interface BaseGameSetting {
  id: number;
  gameTitle: string;
  fpsExperience: string;
  role: string;
  character: string;
  dpi: number;
  device: string;
  createdAt: string;
  comment?: string;
  likesCount?: number; // いいね数（オプション）
}

// 入力フィールドの型定義
export interface InputField {
  type: "select" | "slider" | "input" | "textarea";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[]; // select用
  min?: number; // slider用
  max?: number; // slider用
  step?: number; // slider用
}

// ゲームごとのロールとキャラクター定義
export interface RoleCharacterMap {
  [role: string]: string[]; // キー: ロール名, 値: そのロールのキャラクター配列
}

// ゲームごとの設定フィールド定義
export interface GameFields {
  [key: string]: {
    roles: { value: string; label: string }[];
    characters: RoleCharacterMap;
    specificFields: InputField[];
  };
}

// APEX専用設定
export interface ApexSetting extends BaseGameSetting {
  gameTitle: "APEX";
  sensitivity: number;
  aimSensitivity: number;
  reactcurve: string;
  deadZone: string;
}

// VALORANT専用設定
export interface ValorantSetting extends BaseGameSetting {
  gameTitle: "VALORANT";
  sensitivity: number;
}

// OVERWATCH2専用設定
export interface Overwatch2Setting extends BaseGameSetting {
  gameTitle: "OVERWATCH2";
  sensitivity: number;
}

// すべてのゲーム設定の共用体型
export type GameSetting = ApexSetting | ValorantSetting | Overwatch2Setting;
