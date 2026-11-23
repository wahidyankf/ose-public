// ESLint flat config — DDD bounded-context boundary enforcement.
//
// Severity = "error". Forbidden cross-context or cross-layer imports fail the build.
//
// Why a separate eslint pass alongside oxlint? oxlint does not implement
// `eslint-plugin-boundaries`. We keep oxlint for everything it covers
// (correctness/suspicious/jsx-a11y/import-cycles) and run eslint only for
// the boundary rule.

import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

const SEVERITY = "error";

export default [
  {
    ignores: [".next/**", "coverage/**", "node_modules/**", "src/generated-contracts/**", "storybook-static/**"],
  },
  {
    // Unit tests are hermetic (Test and Gate Contract C21). oxlint bans the clock, environment, and
    // file-system APIs; a zero-argument `new Date()` needs a syntax selector, which only ESLint offers.
    files: ["tests/unit/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Unit tests are hermetic: no clock. Pass a fixed Date.",
        },
      ],
    },
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
      "react-hooks": reactHooks,
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
                ["infrastructure", { context: "${from.context}" }],
                ["presentation", { context: "${from.context}" }],
                ["presentation", { context: "*" }],
                ["application", { context: "*" }],
              ],
            },
            {
              from: [["application", { context: "*" }]],
              allow: [
                "shared",
                ["domain", { context: "${from.context}" }],
                ["application", { context: "${from.context}" }],
                ["infrastructure", { context: "${from.context}" }],
                ["application", { context: "*" }],
              ],
            },
            {
              from: [["infrastructure", { context: "*" }]],
              allow: [
                "shared",
                ["domain", { context: "${from.context}" }],
                ["application", { context: "${from.context}" }],
                ["infrastructure", { context: "${from.context}" }],
                ["domain", { context: "*" }],
              ],
            },
            {
              from: [["domain", { context: "*" }]],
              allow: ["shared", ["domain", { context: "${from.context}" }], ["domain", { context: "*" }]],
            },
            { from: ["shared"], allow: ["shared"] },
          ],
        },
      ],
    },
  },
];
