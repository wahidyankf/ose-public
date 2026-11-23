// @scenario specs/apps/organiclever/be/behaviours/messaging/live/nats-connect.feature: Backend reports healthy after starting with a reachable NATS server
// @scenario specs/apps/organiclever/be/behaviours/messaging/live/nats-connect.feature: Messaging status endpoint reports the failure when NATS is unreachable and the HTTP service still starts
// @scenario specs/apps/organiclever/be/behaviours/messaging/live/jetstream-demo.feature: Messaging status endpoint reports the startup demo message delivered and acked

import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { assertBackendStopped, assertNatsReachable, readJson, readStatus, startBackend } from "./backend-process";
const { Given, When, Then, After } = createBdd();

const unreachableNatsUrl = "nats://127.0.0.1:4999";
let healthStatus = 0;
let messagingStatus = "";
let natsUrlOverridden = false;
let originalNatsUrl: string | undefined;

async function captureStartupOutcome() {
  await startBackend();
  const body = await readJson("/api/v1/system/status/messaging");
  messagingStatus = String(body["jetstream_demo"] ?? "");
  healthStatus = await readStatus("/api/v1/health");
}

After(() => {
  if (!natsUrlOverridden) return;

  if (originalNatsUrl === undefined) {
    delete process.env["ORGANICLEVER_BE_NATS_URL"];
  } else {
    process.env["ORGANICLEVER_BE_NATS_URL"] = originalNatsUrl;
  }

  natsUrlOverridden = false;
});

Given("ORGANICLEVER_BE_NATS_URL points to a running NATS server with JetStream enabled", async () => {
  await assertBackendStopped();
  await assertNatsReachable();
  messagingStatus = "not_started";
});

Given("ORGANICLEVER_BE_NATS_URL points to a NATS server that is unreachable", async () => {
  await assertBackendStopped();
  originalNatsUrl = process.env["ORGANICLEVER_BE_NATS_URL"];
  natsUrlOverridden = true;
  process.env["ORGANICLEVER_BE_NATS_URL"] = unreachableNatsUrl;
});

Given("NATS JetStream is running and organiclever-be is stopped", async () => {
  await assertBackendStopped();
  await assertNatsReachable();
  messagingStatus = "not_started";
});

When("organiclever-be starts up", async () => {
  await captureStartupOutcome();
});

Then("the backend reports healthy after connecting", async () => {
  expect(healthStatus).toBe(200);
});

Then("the backend still serves its health endpoint", async () => {
  expect(healthStatus).toBe(200);
});

Then("the messaging status endpoint reports the startup demo delivered and acked", async () => {
  expect(messagingStatus).toBe("delivered_and_acked");
});

Then("the messaging status endpoint reports NATS as unavailable", async () => {
  expect(messagingStatus).toBe("failed: NATS unavailable at startup");
});
