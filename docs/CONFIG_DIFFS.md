# Config Diffs (Proposed)

プロジェクトの状況に合わせてマージ適用してください。既存設定を上書きしないよう注意。

## tsconfig.json

```diff
 {
   "compilerOptions": {
+    "baseUrl": ".",
+    "paths": { "@/*": ["./*"] },
     // ...既存設定...
   }
 }
```

## eslint.config.mjs（Flat Config想定）

```js
import next from 'eslint-config-next';
import importPlugin from 'eslint-plugin-import';

export default [
  next,
  {
    plugins: { import: importPlugin },
    rules: {
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        pathGroups: [
          { pattern: '@/**', group: 'internal', position: 'after' }
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }],
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/app/**'], message: 'app/* はルーティング層からのみ参照可' },
          { group: ['@/lib/server/**'], message: 'server-only をクライアントで import 禁止' }
        ]
      }]
    }
  }
];
```

依存追加（未導入なら）:

```sh
npm i -D eslint-plugin-import
```

