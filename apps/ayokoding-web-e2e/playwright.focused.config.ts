// Companion config for the focused ordinary specs in tests/e2e/*.spec.ts.
// The canonical-corpus specs run under playwright.config.ts; the BDD runtime
// resolves its config from the generated test directory, so these focused
// specs need their own test directory here. Both configs start the same
// owned Go server on 3191 sequentially.
import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "tests/e2e",
  testMatch: ["browser-progress.spec.ts", "htmx-fragments.spec.ts"],
});
