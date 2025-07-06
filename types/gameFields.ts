import { GameFields } from '@/types/type';

export const gameFields: GameFields = {
    APEX: {
        roles: [
            { value: 'assault', label: 'アサルト' },
            { value: 'skirmisher', label: 'スカーミッシャー' },
            { value: 'recon', label: 'リコン' },
            { value: 'controller', label: 'コントローラー' },
            { value: 'support', label: 'サポート' }
        ],
        characters: {
            assault: ['バンガロール', 'ヒューズ', 'アッシュ', 'バッドマギー','バリスティック'],
            skirmisher: ['パスファインダー', 'レイス', 'オクタン', 'レブナント', 'ホライゾン', 'オルター'],
            recon: ['ブラッドハウンド', 'クリプト', 'ヴァルキリー', 'シア', 'ヴァンテージ'],
            controller: ['コースティック', 'ワットソン', 'ランパート', 'カタリスト'],
            support: ['ジブラルタル', 'ライフライン', 'ミラージュ', 'ローバ', 'ニューキャッスル', 'コンジット']
        },
        specificFields: [
            {
                type: 'slider',
                label: '視点感度',
                required: true,
                min: 0,
                max: 5,
                step: 0.1
            },
            {
                type: 'slider',
                label: '視点感度（エイム時）',
                required: true,
                min: 0,
                max: 5,
                step: 0.1
            },
            {
                type: 'select',
                label: '反応曲線',
                required: true,
                options: [
                    { value: 'classic', label: 'クラシック' },
                    { value: 'linear', label: 'リニア' },
                    { value: 'steady', label: '安定型' },
                    { value: 'highVelocity', label: '高速型' },
                    { value: 'fineAim', label: '高精度型' },
                ]
            },
            {
                type: 'select',
                label: 'デッドゾーン',
                required: true,
                options: [
                    { value: 'none', label: 'なし' },
                    { value: 'small', label: '小' },
                    { value: 'large', label: '大' }
                ]
            }
        ]
    },
    VALORANT: {
        roles: [
            { value: 'duelist', label: 'デュエリスト' },
            { value: 'sentinel', label: 'センチネル' },
            { value: 'initiator', label: 'イニシエーター' },
            { value: 'controller', label: 'コントローラー' },
        ],
        characters: {
            duelist: ['ジェット', 'レイズ', 'フェニックス', 'レイナ', 'ヨル', 'ネオン', 'アイソ'],
            sentinel: ['セージ', 'サイファー', 'キルジョイ', 'チェンバー', 'デッドロック', 'ヴァイス'],
            initiator: ['ブリーチ', 'ソーヴァ', 'スカイ', 'KAY/O', 'フェイド', 'ゲッコー'],
            controller: ['オーメン', 'ブリムストーン', 'ヴァイパー', 'アストラ', 'ハーバー', 'クローヴ'],
        },
        specificFields: [
            {
                type: 'slider',
                label: '感度',
                required: true,
                min: 0,
                max: 1,
                step: 0.01
            }
        ]
    },
    OVERWATCH2: {
        roles: [
            { value: 'support', label: 'サポート' },
            { value: 'tank', label: 'タンク' },
            { value: 'damage', label: 'ダメージ' },
        ],
        characters: {
            support: ['イラリー', 'ルシオ', 'ライフウィーバー','モイラ', 'マーシー', 'ブルギッテ','バティスト', 'ゼニヤッタ', 'キリコ', 'アナ'],
            tank: ['ロードホッグ', 'レッキング・ボール', 'ラマットラ','ラインハルト', 'ドゥームフィスト', 'ジャンカー・クイーン','シグマ', 'オリーサ', 'ウィンストン', 'D.VA'],
            damage: ['リーパー', 'メイ', 'ファラ', 'バスティオン', 'ハンゾー','トレーサー', 'トールビョーン', 'ソンブラ','ソルジャー76', 'ソジョーン', 'ジャンクラット', 'シンメトラ', 'ゲンジ','キャスディ', 'エコー', 'ウィドウメイカー', 'アッシュ']
        },
        specificFields: [
            {
                type: 'slider',
                label: '感度',
                required: true,
                min: 0,
                max: 100,
                step: 1
            }
        ]
    }
};
