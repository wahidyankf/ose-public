// ESLint flat config — DDD bounded-context boundary enforcement.
//
// Phase 8 (current): severity = "error". Forbidden cross-context or
// cross-layer imports fail the build.
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

const SEVERITY = "error"; // Phase 8 enforced.

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
      // Each context-layer pattern captures the bounded-context name into a
      // `context` template variable. Rules below use `${from.context}` to
      // restrict same-context layer crossings (allowed in spirit, forbidden
      // by element-types alone) without opening cross-context coupling.
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
      // Resolve `@/...` path aliases so the boundaries plugin can classify
      // imports by their physical path (and not skip them as unresolved).
      // Without this resolver, a cross-context `@/contexts/journal/...`
      // import is invisible to the rule.
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
            // App router layer: pages may consume any context's published
            // presentation barrel and the application barrel for type-only
            // imports of value/runtime tags. They never reach into
            // domain/infrastructure directly.
            {
              from: ["app"],
              allow: ["shared", "presentation", "application"],
            },
            // Presentation: own-context any layer (incl. infrastructure for
            // type-only runtime tags), other-context presentation/application
            // barrels, shared.
            {
              from: [["presentation", { context: "*" }]],
              allow: [
                "shared",
                ["domain", { context: "${from.context}" }],
                ["application", { context: "${from.context}" }],
                ["infrastructure", { context: "${from.context}" }],
                ["presentation", { context: "${from.context}" }],
                // Cross-context: only published presentation/application
                // barrels (boundaries/no-private would be a stricter
                // separate rule we may add in a future plan).
                ["presentation", { context: "*" }],
                ["application", { context: "*" }],
              ],
            },
            // Application: own-context domain/infrastructure ports,
            // other-context application barrels, shared.
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
            // Infrastructure: own-context domain + application ports,
            // shared, and other-context domain for shared kernel value
            // types (e.g. `Hue`, `ExerciseTemplate` from journal/domain
            // referenced by routine row mapping). Cross-context
            // infrastructure or application is forbidden.
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
            // Domain: own-context domain plus other-context domain (the DDD
            // "shared kernel" pattern — value types like `Hue`,
            // `ExerciseTemplate` defined in journal's domain are referenced
            // by routine's domain via type-only imports). Plus shared.
            {
              from: [["domain", { context: "*" }]],
              allow: ["shared", ["domain", { context: "${from.context}" }], ["domain", { context: "*" }]],
            },
            // Shared: only shared.
            { from: ["shared"], allow: ["shared"] },
          ],
        },
      ],
    },
  },
];
