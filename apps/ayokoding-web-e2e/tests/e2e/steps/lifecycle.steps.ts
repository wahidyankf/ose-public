// Lifecycle hooks for the Playwright E2E adapter. Scenario-owned servers
// (old-origin stubs, launcher binaries) are tracked on the scenario state
// and closed here so no listener survives its scenario. The 3101 old-origin
// stub is started inside the Given steps that need it, mirroring the godog
// step-level external stubs.
import { createBdd } from "playwright-bdd";
import { stateFor } from "../support/state";

const { After } = createBdd();

After(async ({ page }) => {
  const state = stateFor(page);
  for (const server of state.owned.splice(0)) {
    await server.close();
  }
});
