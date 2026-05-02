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
        // Phase 1 app shell — UI-only components covered by e2e, not unit tests
        "src/components/app/app-root.tsx",
        "src/components/app/tab-bar.tsx",
        "src/components/app/side-nav.tsx",
        // Phase 2 home screen — runtime+browser-dependent UI; covered by e2e
        "src/components/app/home/home-screen.tsx",
        "src/components/app/home/week-rhythm-strip.tsx",
        "src/components/app/home/entry-item.tsx",
        "src/components/app/home/entry-detail-sheet.tsx",
        "src/components/app/home/routine-card.tsx",
        "src/components/app/home/workout-module-view.tsx",
        // Phase 6 routine screens — PGlite+browser-dependent UI; covered by e2e
        "src/components/app/routine/edit-routine-screen.tsx",
        "src/components/app/routine/exercise-editor-row.tsx",
        // Phase 7 progress screens — PGlite+browser-dependent UI; covered by e2e
        "src/components/app/progress/progress-screen.tsx",
        "src/components/app/progress/exercise-progress-card.tsx",
        // Phase 7 history screens — PGlite+browser-dependent UI; covered by e2e
        "src/components/app/history/history-screen.tsx",
        "src/components/app/history/session-card.tsx",
        "src/components/app/history/weekly-bar-chart.tsx",
        // Phase 8 settings screen — PGlite+browser-dependent UI; covered by e2e
        "src/components/app/settings/settings-screen.tsx",
        // Phase 4 workout screens — PGlite+XState+setInterval UI; covered by e2e
        "src/components/app/workout/workout-screen.tsx",
        "src/components/app/workout/active-exercise-row.tsx",
        "src/components/app/workout/rest-timer.tsx",
        "src/components/app/workout/set-edit-sheet.tsx",
        "src/components/app/workout/set-timer-sheet.tsx",
        "src/components/app/workout/end-workout-sheet.tsx",
        "src/components/app/workout/finish-screen.tsx",
        // Phase 1 hook — browser-only; covered by e2e
        "src/lib/hooks/use-hash.ts",
        // Seed — PGlite side-effect-only; covered by integration tests
        "src/lib/journal/seed.ts",
        // i18n hook — browser-only; covered by e2e
        "src/lib/i18n/use-t.ts",
        "src/proxy.ts",
        "src/test/**",
        "src/services/**",
        "src/layers/**",
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
