import { defineConfig } from "vitest/config";
// => Config import again: thresholds are committed policy like exclusions.

export default defineConfig({
  // => Typed config: a misspelled threshold key fails instead of passing lax.
  // => Test section: coverage policy sits beside the runner settings.
  test: {
    // => Test section: coverage policy sits beside the runner settings.
    coverage: {
      // => Coverage section: provider, reporter, and floors in one place.
      provider: "v8",
      // => V8 provider: same engine as every example in this cluster.
      reporter: ["text"],
      // => Text reporter: the table still prints for humans on every run.
      thresholds: { lines: 80, branches: 80, functions: 80 },
      // => Floors at 80: the module below scores 100, so the gate holds.
      // => Set floors BELOW today: new code must keep up, old code stays green.
      // => Raising floors is a deliberate commit: progress, ratcheted.
    },
  },
});
