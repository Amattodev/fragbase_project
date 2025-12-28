export type CharacterMeta = {
  avatar?: string;
  roleKey?: string;
  roleIcon?: string;
  roleName?: string;
};

export type CharacterMetaMap = Record<string, CharacterMeta>;

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildCharacterAvatarPath(slug: string, charName: string) {
  const key = slugify(charName);
  return `/images/games/${slug}/characters/${key}.png`;
}

export function buildRoleIconPath(slug: string, roleKey: string) {
  const key = slugify(roleKey);
  return `/images/games/${slug}/roles/${key}.svg`;
}

export function buildRankBadgePath(slug: string, rankLabel: string) {
  const key = slugify(rankLabel);
  return `/images/games/${slug}/ranks/${key}.webp`;
}

export type GameRankDef = {
  value: string;
  label: string;
};

export type GameCharacterDef = {
  value: string;
  label: string;
  imagePath: string;
};

// NOTE: APEX用のランク・レジェンド定義
// 画像ファイルを public/images/games/apex-legends/ 以下に配置すれば自動で反映される想定。
export const APEX_RANKS: GameRankDef[] = [
  { value: "Rookie", label: "Rookie" },
  { value: "Bronze", label: "Bronze" },
  { value: "Silver", label: "Silver" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
  { value: "Diamond", label: "Diamond" },
  { value: "Master", label: "Master" },
  { value: "Apex Predator", label: "Apex Predator" },
];

export const APEX_CHARACTERS: GameCharacterDef[] = [
  // assault
  { value: "バンガロール", label: "バンガロール", imagePath: "/images/games/apex-legends/characters/bangalore.png" },
  { value: "ヒューズ", label: "ヒューズ", imagePath: "/images/games/apex-legends/characters/fuse.png" },
  { value: "アッシュ", label: "アッシュ", imagePath: "/images/games/apex-legends/characters/ash.png" },
  { value: "バッドマギー", label: "バッドマギー", imagePath: "/images/games/apex-legends/characters/mad-maggie.png" },
  { value: "バリスティック", label: "バリスティック", imagePath: "/images/games/apex-legends/characters/ballistic.png" },
  // skirmisher
  { value: "パスファインダー", label: "パスファインダー", imagePath: "/images/games/apex-legends/characters/pathfinder.png" },
  { value: "レイス", label: "レイス", imagePath: "/images/games/apex-legends/characters/wraith.png" },
  { value: "オクタン", label: "オクタン", imagePath: "/images/games/apex-legends/characters/octane.png" },
  { value: "レブナント", label: "レブナント", imagePath: "/images/games/apex-legends/characters/revenant.png" },
  { value: "ホライゾン", label: "ホライゾン", imagePath: "/images/games/apex-legends/characters/horizon.png" },
  { value: "オルター", label: "オルター", imagePath: "/images/games/apex-legends/characters/alter.png" },
  // recon
  { value: "ブラッドハウンド", label: "ブラッドハウンド", imagePath: "/images/games/apex-legends/characters/bloodhound.png" },
  { value: "クリプト", label: "クリプト", imagePath: "/images/games/apex-legends/characters/crypto.png" },
  { value: "ヴァルキリー", label: "ヴァルキリー", imagePath: "/images/games/apex-legends/characters/valkyrie.png" },
  { value: "シア", label: "シア", imagePath: "/images/games/apex-legends/characters/seer.png" },
  { value: "ヴァンテージ", label: "ヴァンテージ", imagePath: "/images/games/apex-legends/characters/vantage.png" },
  // controller
  { value: "コースティック", label: "コースティック", imagePath: "/images/games/apex-legends/characters/caustic.png" },
  { value: "ワットソン", label: "ワットソン", imagePath: "/images/games/apex-legends/characters/wattson.png" },
  { value: "ランパート", label: "ランパート", imagePath: "/images/games/apex-legends/characters/rampart.png" },
  { value: "カタリスト", label: "カタリスト", imagePath: "/images/games/apex-legends/characters/catalyst.png" },
  // support
  { value: "ジブラルタル", label: "ジブラルタル", imagePath: "/images/games/apex-legends/characters/gibraltar.png" },
  { value: "ライフライン", label: "ライフライン", imagePath: "/images/games/apex-legends/characters/lifeline.png" },
  { value: "ミラージュ", label: "ミラージュ", imagePath: "/images/games/apex-legends/characters/mirage.png" },
  { value: "ローバ", label: "ローバ", imagePath: "/images/games/apex-legends/characters/loba.png" },
  { value: "ニューキャッスル", label: "ニューキャッスル", imagePath: "/images/games/apex-legends/characters/newcastle.png" },
  { value: "コンジット", label: "コンジット", imagePath: "/images/games/apex-legends/characters/conduit.png" },
];

// NOTE: Overwatch 2 用のランク・ヒーロー定義
// 画像ファイルを public/images/games/overwatch-2/ 以下に配置すれば自動で反映される想定。
export const OVERWATCH_RANKS: GameRankDef[] = [
  { value: "Bronze", label: "Bronze" },
  { value: "Silver", label: "Silver" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
  { value: "Diamond", label: "Diamond" },
  { value: "Master", label: "Master" },
  { value: "Grandmaster", label: "Grandmaster" },
  { value: "Top 500", label: "Top 500" },
];

export const OVERWATCH_CHARACTERS: GameCharacterDef[] = [
  // support
  { value: "イラリー", label: "イラリー", imagePath: "/images/games/overwatch-2/characters/illari.png" },
  { value: "ルシオ", label: "ルシオ", imagePath: "/images/games/overwatch-2/characters/lucio.png" },
  { value: "ライフウィーバー", label: "ライフウィーバー", imagePath: "/images/games/overwatch-2/characters/weaver.png" },
  { value: "モイラ", label: "モイラ", imagePath: "/images/games/overwatch-2/characters/moira.png" },
  { value: "マーシー", label: "マーシー", imagePath: "/images/games/overwatch-2/characters/mercy.png" },
  { value: "ブルギッテ", label: "ブルギッテ", imagePath: "/images/games/overwatch-2/characters/brigitte.png" },
  { value: "バティスト", label: "バティスト", imagePath: "/images/games/overwatch-2/characters/baptiste.png" },
  { value: "ゼニヤッタ", label: "ゼニヤッタ", imagePath: "/images/games/overwatch-2/characters/zenyatta.png" },
  { value: "キリコ", label: "キリコ", imagePath: "/images/games/overwatch-2/characters/kiriko.png" },
  { value: "アナ", label: "アナ", imagePath: "/images/games/overwatch-2/characters/ana.png" },
  // tank
  { value: "ロードホッグ", label: "ロードホッグ", imagePath: "/images/games/overwatch-2/characters/roadhog.png" },
  { value: "レッキング・ボール", label: "レッキング・ボール", imagePath: "/images/games/overwatch-2/characters/wrecking-ball.png" },
  { value: "ラマットラ", label: "ラマットラ", imagePath: "/images/games/overwatch-2/characters/ramattra.png" },
  { value: "ラインハルト", label: "ラインハルト", imagePath: "/images/games/overwatch-2/characters/reinhardt.png" },
  { value: "ドゥームフィスト", label: "ドゥームフィスト", imagePath: "/images/games/overwatch-2/characters/doomfist.png" },
  { value: "ジャンカー・クイーン", label: "ジャンカー・クイーン", imagePath: "/images/games/overwatch-2/characters/junker-queen.png" },
  { value: "シグマ", label: "シグマ", imagePath: "/images/games/overwatch-2/characters/sigma.png" },
  { value: "オリーサ", label: "オリーサ", imagePath: "/images/games/overwatch-2/characters/orisa.png" },
  { value: "ウィンストン", label: "ウィンストン", imagePath: "/images/games/overwatch-2/characters/winston.png" },
  { value: "D.VA", label: "D.VA", imagePath: "/images/games/overwatch-2/characters/dva.png" },
  // damage
  { value: "リーパー", label: "リーパー", imagePath: "/images/games/overwatch-2/characters/reaper.png" },
  { value: "メイ", label: "メイ", imagePath: "/images/games/overwatch-2/characters/mei.png" },
  { value: "ファラ", label: "ファラ", imagePath: "/images/games/overwatch-2/characters/pharah.png" },
  { value: "バスティオン", label: "バスティオン", imagePath: "/images/games/overwatch-2/characters/bastion.png" },
  { value: "ハンゾー", label: "ハンゾー", imagePath: "/images/games/overwatch-2/characters/hanzo.png" },
  { value: "トレーサー", label: "トレーサー", imagePath: "/images/games/overwatch-2/characters/tracer.png" },
  { value: "トールビョーン", label: "トールビョーン", imagePath: "/images/games/overwatch-2/characters/torbjorn.png" },
  { value: "ソンブラ", label: "ソンブラ", imagePath: "/images/games/overwatch-2/characters/sombra.png" },
  { value: "ソルジャー76", label: "ソルジャー76", imagePath: "/images/games/overwatch-2/characters/soldier-76.png" },
  { value: "ソジョーン", label: "ソジョーン", imagePath: "/images/games/overwatch-2/characters/sojourn.png" },
  { value: "ジャンクラット", label: "ジャンクラット", imagePath: "/images/games/overwatch-2/characters/junkrat.png" },
  { value: "シンメトラ", label: "シンメトラ", imagePath: "/images/games/overwatch-2/characters/symmetra.png" },
  { value: "ゲンジ", label: "ゲンジ", imagePath: "/images/games/overwatch-2/characters/genji.png" },
  { value: "キャスディ", label: "キャスディ", imagePath: "/images/games/overwatch-2/characters/cassidy.png" },
  { value: "エコー", label: "エコー", imagePath: "/images/games/overwatch-2/characters/echo.png" },
  { value: "ウィドウメイカー", label: "ウィドウメイカー", imagePath: "/images/games/overwatch-2/characters/widowmaker.png" },
  { value: "アッシュ", label: "アッシュ", imagePath: "/images/games/overwatch-2/characters/ashe.png" },
];

// NOTE: VALORANT用のランク・エージェント定義
// 画像ファイルを public/images/games/valorant/ 以下に配置すれば自動で反映される想定。
// ランクは段階（Iron / Bronze / ...）のみを扱い、数字ティアは区別しない。
export const VALORANT_RANKS: GameRankDef[] = [
  { value: "Iron", label: "Iron" },
  { value: "Bronze", label: "Bronze" },
  { value: "Silver", label: "Silver" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
  { value: "Diamond", label: "Diamond" },
  { value: "Ascendant", label: "Ascendant" },
  { value: "Immortal", label: "Immortal" },
  { value: "Radiant", label: "Radiant" },
];

export const VALORANT_AGENTS: GameCharacterDef[] = [
  { value: "ジェット", label: "ジェット", imagePath: "/images/games/valorant/characters/jett.png" },
  { value: "レイズ", label: "レイズ", imagePath: "/images/games/valorant/characters/raze.png" },
  { value: "フェニックス", label: "フェニックス", imagePath: "/images/games/valorant/characters/phoenix.png" },
  { value: "レイナ", label: "レイナ", imagePath: "/images/games/valorant/characters/reyna.png" },
  { value: "ヨル", label: "ヨル", imagePath: "/images/games/valorant/characters/yoru.png" },
  { value: "ネオン", label: "ネオン", imagePath: "/images/games/valorant/characters/neon.png" },
  { value: "アイソ", label: "アイソ", imagePath: "/images/games/valorant/characters/iso.png" },
  { value: "セージ", label: "セージ", imagePath: "/images/games/valorant/characters/sage.png" },
  { value: "サイファー", label: "サイファー", imagePath: "/images/games/valorant/characters/cypher.png" },
  { value: "キルジョイ", label: "キルジョイ", imagePath: "/images/games/valorant/characters/killjoy.png" },
  { value: "チェンバー", label: "チェンバー", imagePath: "/images/games/valorant/characters/chamber.png" },
  { value: "デッドロック", label: "デッドロック", imagePath: "/images/games/valorant/characters/deadlock.png" },
  { value: "ヴァイス", label: "ヴァイス", imagePath: "/images/games/valorant/characters/vyse.png" },
  { value: "ブリーチ", label: "ブリーチ", imagePath: "/images/games/valorant/characters/breach.png" },
  { value: "ソーヴァ", label: "ソーヴァ", imagePath: "/images/games/valorant/characters/sova.png" },
  { value: "スカイ", label: "スカイ", imagePath: "/images/games/valorant/characters/skye.png" },
  { value: "KAY/O", label: "KAY/O", imagePath: "/images/games/valorant/characters/kayo.png" },
  { value: "フェイド", label: "フェイド", imagePath: "/images/games/valorant/characters/fade.png" },
  { value: "ゲッコー", label: "ゲッコー", imagePath: "/images/games/valorant/characters/gekko.png" },
  { value: "オーメン", label: "オーメン", imagePath: "/images/games/valorant/characters/omen.png" },
  { value: "ブリムストーン", label: "ブリムストーン", imagePath: "/images/games/valorant/characters/brimstone.png" },
  { value: "ヴァイパー", label: "ヴァイパー", imagePath: "/images/games/valorant/characters/viper.png" },
  { value: "アストラ", label: "アストラ", imagePath: "/images/games/valorant/characters/astra.png" },
  { value: "ハーバー", label: "ハーバー", imagePath: "/images/games/valorant/characters/harbor.png" },
  { value: "クローヴ", label: "クローヴ", imagePath: "/images/games/valorant/characters/clove.png" },
];
