import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Keep imports tidy and grouped, treat "@/*" as internal
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
    },
  },
  {
    files: ["components/**/*", "lib/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*"],
              message: "Do not import from app/* outside of app/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/page.tsx", "app/**/_components/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/server/*"],
              message: "UI (app/*) must not import server-only modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["components/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/server/*"],
              message: "Do not import server-only code into components.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/services/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/server/*"],
              message: "Only server-side services may import server-only code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/services/**/*.ts"],
    rules: {
      // Keep service files focused and small. Only warnings to avoid CI failures.
      "max-lines": [
        "warn",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["warn", { max: 12 }],
      "max-params": ["warn", 4],
    },
  },
  {
    files: ["lib/services/server/**/*"],
    rules: {
      // Allow server-only imports inside server-side services
      "no-restricted-imports": "off",
    },
  },
];

export default eslintConfig;
