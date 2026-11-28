// Lifecycle hooks for the HTTP boundary adapter. Scenario-owned servers are
// tracked on the scenario state and closed here, so no listener survives its scenario.
import { createBdd } from "playwright-bdd";
import { stateFor } from "../support/state";

const { After } = createBdd();

After(async ({ request }) => {
  const state = stateFor(request);
  for (const server of state.owned.splice(0)) {
    await server.close();
  }
});
