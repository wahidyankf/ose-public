// ESLint flat config — DDD bounded-context boundary enforcement.
//
// Severity = "error". Forbidden cross-context or cross-layer imports fail the lint target.
//
// Why a separate eslint pass alongside oxlint? oxlint does not implement
// `eslint-plugin-boundaries`. oxlint keeps everything it covers (correctness,
// suspicious, jsx-a11y, import cycles) and eslint runs only for the boundary rule.

import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import tsParser from "@typescript-eslint/parser";

const SEVERITY = "error";

export default [
  {
    ignores: [".next/**", "coverage/**", "node_modules/**", "**/*.test.*", "tests/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      boundaries,
      import: importPlugin,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "shared", pattern: "src/shared/**" },
        {
          type: "domain",
          pattern: "src/contexts/*/domain",
          capture: ["context"],
          mode: "folder",
        },
        {
          type: "application",
          pattern: "src/contexts/*/application",
          capture: ["context"],
          mode: "folder",
        },
        {
          type: "infrastructure",
          pattern: "src/contexts/*/infrastructure",
          capture: ["context"],
          mode: "folder",
        },
        {
          type: "presentation",
          pattern: "src/contexts/*/presentation",
          capture: ["context"],
          mode: "folder",
        },
      ],
      "boundaries/include": ["src/**/*.{ts,tsx}"],
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      "boundaries/element-types": [
        SEVERITY,
        {
          default: "disallow",
          rules: [
            {
              from: ["app"],
              allow: ["shared", "presentation", "application"],
            },
            {
              from: [["presentation", { context: "*" }]],
              allow: [
                "shared",
                ["domain", { context: "${from.context}" }],
                ["application", { context: "${from.context}" }],
                ["presentation", { context: "${from.context}" }],
              ],
            },
            {
              from: [["application", { context: "*" }]],
              allow: [
                "shared",
                ["domain", { context: "${from.context}" }],
                ["application", { context: "${from.context}" }],
                ["infrastructure", { context: "${from.context}" }],
              ],
            },
            {
              from: [["infrastructure", { context: "*" }]],
              allow: [
                "shared",
                ["domain", { context: "${from.context}" }],
                ["application", { context: "${from.context}" }],
              ],
            },
            {
              from: [["domain", { context: "*" }]],
              allow: ["shared", ["domain", { context: "${from.context}" }]],
            },
            { from: ["shared"], allow: ["shared"] },
          ],
        },
      ],
    },
  },
];
