// => Capstone coverage gate: the floor the suite must keep clearing.
// => Lines and functions at 100, branches at 85: the alive-flag cleanup and
// => the non-Error rejection default are defensive paths the suite documents
// => but never executes, exactly the judgment Example 60 teaches.
import { defineConfig } from "vitest/config";
// => Config import: coverage thresholds live beside the suite they guard.

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // => v8 engine: function-level accuracy the text table below reports.
      reporter: ["text"],
      // => Text table: humans read the run; machines would take json-summary.
      thresholds: {
        lines: 100,
        // => Full line floor: every executable line runs in the suite.
        functions: 100,
        // => Full function floor: every handler and callback is invoked.
        branches: 85,
        // => Branch floor: defensive cleanup paths may stay uncovered by design.
        statements: 100,
        // => Full statement floor: no dead code ships in the fixture library.
      },
    },
  },
});
