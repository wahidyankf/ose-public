import { defineConfig } from "vitest/config";
// => Config import: include patterns are committed scoping decisions.

export default defineConfig({
  // => Typed config: a pattern that matches nothing warns, never silently.
  // => Test section: include scoping beside provider and reporter.
  test: {
    // => Test section: include scoping beside provider and reporter.
    // => Coverage section: include narrows, reporter prints the narrow view.
    coverage: {
      // => Coverage section: include narrows, reporter prints the narrow view.
      provider: "v8",
      // => V8 provider unchanged: scoping is about files, not engines.
      reporter: ["text"],
      // => Text reporter: the table below lists only the included module.
      include: ["cart.ts"],
      // => Only cart.ts is measured: legacy.ts runs but is never scored.
      // => Scoped suites answer per-module questions during migrations.
    },
  },
});
