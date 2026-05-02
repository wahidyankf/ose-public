import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const sharedPlugins = [react(), tsconfigPaths()];

export default defineConfig({
  plugins: sharedPlugins,
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Next.js route infrastructure — covered by e2e, not unit tests
        "src/app/layout.tsx",
        "src/app/**/page.tsx",
        "src/app/api/**",
        // Phase 1 app shell — UI-only components covered by e2e, not unit tests.
        // Migrated to app-shell/presentation/components/ in DDD adoption Phase 8.
        "src/contexts/app-shell/presentation/components/tab-bar.tsx",
        "src/contexts/app-shell/presentation/components/side-nav.tsx",
        "src/contexts/app-shell/presentation/components/overlay-tree.tsx",
        // Phase 2 home screen — runtime+browser-dependent UI; covered by e2e.
        // Migrated to app-shell/presentation/components/home/ in DDD adoption Phase 8.
        "src/contexts/app-shell/presentation/components/home/home-screen.tsx",
        "src/contexts/app-shell/presentation/components/home/week-rhythm-strip.tsx",
        "src/contexts/app-shell/presentation/components/home/entry-item.tsx",
        "src/contexts/app-shell/presentation/components/home/entry-detail-sheet.tsx",
        "src/contexts/app-shell/presentation/components/home/routine-card.tsx",
        "src/contexts/app-shell/presentation/components/home/workout-module-view.tsx",
        // Phase 6 routine screens — PGlite+browser-dependent UI; covered by e2e.
        // Migrated to routine/presentation/components/ in DDD adoption Phase 7a.
        "src/contexts/routine/presentation/components/edit-routine-screen.tsx",
        "src/contexts/routine/presentation/components/exercise-editor-row.tsx",
        // Phase 7 progress screens — PGlite+browser-dependent UI; covered by e2e.
        // Migrated to stats/presentation/components/ in DDD adoption Phase 7c.
        "src/contexts/stats/presentation/components/progress-screen.tsx",
        "src/contexts/stats/presentation/components/exercise-progress-card.tsx",
        // Phase 7 history screens — PGlite+browser-dependent UI; covered by e2e.
        // Migrated to stats/presentation/components/ in DDD adoption Phase 7c.
        "src/contexts/stats/presentation/components/history-screen.tsx",
        "src/contexts/stats/presentation/components/session-card.tsx",
        "src/contexts/stats/presentation/components/weekly-bar-chart.tsx",
        // Phase 8 settings screen — PGlite+browser-dependent UI; covered by e2e.
        // Migrated to settings/presentation/components/ in DDD adoption Phase 5.
        "src/contexts/settings/presentation/components/settings-screen.tsx",
        // Phase 4 workout screens — PGlite+XState+setInterval UI; covered by e2e.
        // Migrated to workout-session/presentation/components/ in DDD adoption Phase 7b.
        "src/contexts/workout-session/presentation/components/workout-screen.tsx",
        "src/contexts/workout-session/presentation/components/active-exercise-row.tsx",
        "src/contexts/workout-session/presentation/components/rest-timer.tsx",
        "src/contexts/workout-session/presentation/components/set-edit-sheet.tsx",
        "src/contexts/workout-session/presentation/components/set-timer-sheet.tsx",
        "src/contexts/workout-session/presentation/components/end-workout-sheet.tsx",
        "src/contexts/workout-session/presentation/components/finish-screen.tsx",
        // Phase 1 hook — browser-only; covered by e2e
        "src/lib/hooks/use-hash.ts",
        // Seed — PGlite side-effect-only; covered by integration tests.
        // Migrated to journal/infrastructure/ in DDD adoption Phase 6c.
        "src/contexts/journal/infrastructure/seed.ts",
        // i18n hook — browser-only; covered by e2e.
        // Migrated to app-shell/presentation/ in DDD adoption Phase 8.
        "src/contexts/app-shell/presentation/use-t.ts",
        "src/proxy.ts",
        "src/test/**",
        // Dormant BE integration code (legacy `src/services/` + `src/layers/`)
        // — relocated to the health context's infrastructure layer in the
        // DDD adoption migration. Still covered by e2e, not unit tests.
        "src/contexts/health/infrastructure/**",
        "src/generated-contracts/**",
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
      ],
      thresholds: {
        lines: 70,
        functions: 50,
        branches: 60,
        statements: 70,
      },
      reporter: ["text", "json-summary", "lcov"],
    },
    projects: [
      {
        plugins: sharedPlugins,
        test: {
          name: "unit",
          include: ["test/unit/**/*.steps.{ts,tsx}", "**/*.unit.{test,spec}.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["node_modules", "**/*.int.{test,spec}.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          // PGlite-backed `@effect/vitest` `layer()` suites and React-hook
          // tests using `renderHook` + `waitFor` spin up an in-memory
          // database in beforeEach via a scoped Layer. Under v8 coverage
          // instrumentation the cold-start path can exceed the default
          // timeouts, surfacing as flaky "Hook timed out in 10000ms" or
          // `waitFor` assertion failures across journal/settings/routine/
          // stats store and hook tests. Raise both budgets uniformly.
          testTimeout: 30000,
          hookTimeout: 30000,
        },
      },
      {
        plugins: sharedPlugins,
        test: {
          name: "integration",
          include: ["test/integration/**/*.{test,spec}.{ts,tsx}", "src/**/*.int.{test,spec}.{ts,tsx}"],
          exclude: ["node_modules"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          testTimeout: 30000,
          hookTimeout: 30000,
        },
      },
    ],
  },
});
