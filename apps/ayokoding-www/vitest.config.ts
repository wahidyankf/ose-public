import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const sharedPlugins = [react(), tsconfigPaths()];

export default defineConfig({
  plugins: sharedPlugins,
  test: {
    passWithNoTests: true,
    // Reduced Nx cross-project parallelism (--parallel=2, added to bound CI memory) leaves less
    // CPU per test under contention; userEvent.type()'s per-keystroke re-renders occasionally
    // exceed the default timeout under that load even though the interaction is simple. This
    // setting has no effect on the named projects below — vitest's `projects` array replaces
    // rather than merges the top-level `test` config, so each project repeats it.
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // App shell presentation (chrome) — passive UI primitives + layout shell
        "src/features/app-shell/shell/*.tsx",
        // Per-feature presentation (UI surfaces — exercised via E2E + fe-step Gherkin scenarios)
        "src/features/content/shell/*.tsx",
        "src/features/search/shell/*.tsx",
        "src/features/search/shell/use-search.ts",
        "src/features/i18n/shell/*.tsx",
        "src/features/i18n/shell/use-locale.ts",
        "src/features/navigation/shell/*.tsx",
        // Re-export shim — pure type re-export, no executable code
        "src/features/navigation/core/schemas.ts",
        // Next.js app router pages — covered via E2E
        "src/app/**",
        // Cross-cutting tRPC client wiring
        "src/lib/trpc/client.ts",
        "src/lib/trpc/provider.tsx",
        "src/lib/trpc/server.ts",
        // Content infrastructure adapters + scripts (covered via unit suite with mocked deps)
        "src/features/content/core/parser.ts",
        "src/features/content/shell/reader.ts",
        "src/features/content/core/repository.ts",
        "src/features/content/shell/repository-fs.ts",
        "src/features/content/core/types.ts",
        "src/features/content/shell/index-generator.ts",
        "src/features/search/shell/generate-search-data.ts",
        "src/scripts/**",
        // tRPC routers — composition-only; behaviour is exercised via BE-E2E
        "src/features/*/shell/router.ts",
        "src/features/app-shell/shell/root-router.ts",
        // Test infra
        "src/test/**",
        "**/*.{test,spec}.{ts,tsx}",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      reporter: ["text", "json-summary", "lcov"],
    },
    projects: [
      {
        plugins: sharedPlugins,
        test: {
          name: "unit",
          include: ["tests/unit/be-steps/**/*.steps.ts", "tests/unit/**/*.unit.{test,spec}.{ts,tsx}"],
          // `next build` copies the whole app — tests included — into
          // `.next/standalone/apps/ayokoding-www/`, where the unprefixed
          // `**/*.unit.test.ts` glob above matches every copy. Those copies then
          // fail on their own relative imports, so a run that follows a build in
          // the same workspace reports five phantom failures. Excluding the build
          // output is what keeps `build` and `test:quick` composable.
          exclude: ["node_modules", "**/.next/**"],
          environment: "node",
          // vitest's `projects` array replaces rather than merges the top-level `test` config
          // per project, so testTimeout must be repeated here (see the top-level comment).
          testTimeout: 30000,
        },
      },
      {
        plugins: sharedPlugins,
        test: {
          name: "unit-fe",
          include: [
            "tests/unit/fe-steps/**/*.steps.{ts,tsx}",
            "tests/unit/features/**/*.test.{ts,tsx}",
            // `tests/unit/app/**` also holds jsdom/@testing-library React component tests (e.g.
            // `benchmark-content.test.tsx`) — without this, neither this project's nor the
            // "unit" (node) project's glob discovers them at all, so the test silently never
            // runs (exits 0 with zero files matched) instead of failing (pr-review-synthesis-maker
            // HIGH finding F2, PR #122 cycle 3). Renaming such a file to `*.unit.test.tsx` instead
            // is NOT a fix — that routes it to the "unit" project below, which runs
            // `environment: "node"` with no `setupFiles`, and `@testing-library/react`'s
            // `render()`/`screen` hard-fail under Node.
            "tests/unit/app/**/*.test.{ts,tsx}",
          ],
          // `*.test.{ts,tsx}` is a suffix match, so `*` also swallows a `.unit.test.ts` file's
          // `.unit` segment (e.g. `service.unit.test.ts` matches this glob too) — excluded here so
          // every `.unit.test.ts`/`.unit.test.tsx` file runs exactly once, under the "unit" (node)
          // project above, never doubly under jsdom too (course-paths plan, Phase 3 — found via
          // `service.unit.test.ts` and `index-generator.unit.test.ts`, the first files placed under
          // `src/features/**` using this naming convention; every pre-existing `.unit.test.ts` file
          // lives outside `src/features/**`, which is why this double-match was never triggered
          // before). The same exclusion covers `tests/unit/app/**` for the identical reason.
          exclude: ["node_modules", "**/*.unit.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          // Vitest blanks every CSS import unless it is listed here. The AI benchmark steps read the
          // token stylesheet with `?raw` and check its text, so that file must pass through unchanged.
          css: { include: [/ayokoding\.css/] },
          testTimeout: 30000,
        },
      },
    ],
  },
});
