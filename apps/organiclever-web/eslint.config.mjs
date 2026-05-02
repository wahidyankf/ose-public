// ESLint flat config — DDD bounded-context boundary enforcement.
//
// Phase 1 (current): severity = "warn" (dry-run). Records violations as
// warnings; lint exits zero so the build is unaffected.
// Phase 8 (later):  severity = "error". Forbidden imports fail the build.
//
// Why a separate eslint pass alongside oxlint? oxlint does not implement
// `eslint-plugin-boundaries`. We keep oxlint for everything it covers
// (correctness/suspicious/jsx-a11y/import-cycles) and run eslint only for
// the boundary rule. See plans/in-progress/2026-05-02__organiclever-adopt-ddd
// /tech-docs.md § "ESLint boundaries" and apps/organiclever-web/docs/
// explanation/bounded-context-map.md § "Enforcement".

import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

const SEVERITY = "warn"; // Phase 1 dry-run; flip to "error" in Phase 8.

export default [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "node_modules/**",
      "src/generated-contracts/**",
      "storybook-static/**",
      "**/*.unit.test.*",
      "**/*.int.test.*",
      "test/**",
    ],
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
      // Registered (but no rules enabled) so that existing
      // `// eslint-disable-next-line react-hooks/exhaustive-deps` comments
      // in source resolve. Boundaries is the only rule we enforce here;
      // hook correctness is covered elsewhere (oxlint + tests).
      "react-hooks": reactHooks,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "shared", pattern: "src/shared/**" },
        { type: "domain", pattern: "src/contexts/*/domain/**" },
        { type: "application", pattern: "src/contexts/*/application/**" },
        { type: "infrastructure", pattern: "src/contexts/*/infrastructure/**" },
        { type: "presentation", pattern: "src/contexts/*/presentation/**" },
      ],
      "boundaries/include": ["src/**/*.{ts,tsx}"],
    },
    rules: {
      "boundaries/element-types": [
        SEVERITY,
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["shared", "presentation"] },
            {
              from: "presentation",
              allow: ["shared", "domain", "application", "presentation"],
            },
            { from: "application", allow: ["shared", "domain", "application"] },
            { from: "infrastructure", allow: ["shared", "domain"] },
            { from: "domain", allow: ["shared", "domain"] },
            { from: "shared", allow: ["shared"] },
          ],
        },
      ],
    },
  },
];
