import { defineConfig } from "vitest/config";
// => Config import: coverage scoping lives in a committed config file.
// => Committed config is reviewable: exclusions are decisions, not accidents.

export default defineConfig({
  // => defineConfig types the config: typos fail loudly instead of silently.
  // => Test section holds runners, environment, and coverage together.
  test: {
    // => Test section holds runners, environment, and coverage together.
    coverage: {
      // => Coverage section: provider, reporters, and scoping in one place.
      provider: "v8",
      // => V8 provider: fast, built into Node, the course default everywhere.
      reporter: ["text"],
      // => Text reporter: the terminal table the lesson quotes below.
      exclude: ["**/helpers.ts"],
      // => Helper files excluded: support code never counts as product code.
      // => Exclusions are explicit and reviewed: each line needs a reason.
    },
  },
});
