/**
 * Step definitions for the OSE Application BE messaging feature.
 *
 * Covers: specs/apps/ose/be/behaviours/messaging/
 */
// @scenario specs/apps/ose/be/behaviours/messaging/live/nats-connect.feature: Backend reports healthy after starting with a reachable NATS server
// @scenario specs/apps/ose/be/behaviours/messaging/live/nats-connect.feature: Messaging status endpoint reports the failure when NATS is unreachable and the HTTP service still starts
// @scenario specs/apps/ose/be/behaviours/messaging/live/jetstream-demo.feature: Messaging status endpoint reports the startup demo message delivered and acked
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { assertBackendStopped, assertNatsReachable, readJson, readStatus, startBackend } from "./backend-process";
const { Given, When, Then } = createBdd();

// A closed loopback port: the broker refuses the connection, so ose-be records the startup failure.
const unreachableNatsUrl = "nats://127.0.0.1:1";

let natsUrlOverride: string | undefined;
let healthStatus = 0;
let messagingStatus = "";

async function captureStartupOutcome() {
  await startBackend(natsUrlOverride ? { OSE_BE_NATS_URL: natsUrlOverride } : {});
  const body = await readJson("/api/v1/system/status/messaging");
  messagingStatus = String(body["jetstream_demo"] ?? "");
  healthStatus = await readStatus("/api/v1/health");
}

Given("OSE_BE_NATS_URL points to a running NATS server with JetStream enabled", async () => {
  await assertBackendStopped();
  await assertNatsReachable();
  natsUrlOverride = undefined;
  messagingStatus = "not_started";
});

Given("OSE_BE_NATS_URL points to a NATS server that is not reachable", async () => {
  await assertBackendStopped();
  natsUrlOverride = unreachableNatsUrl;
  messagingStatus = "not_started";
});

Given("NATS JetStream is running and ose-be is stopped", async () => {
  await assertBackendStopped();
  await assertNatsReachable();
  natsUrlOverride = undefined;
  messagingStatus = "not_started";
});

When("ose-be starts up", async () => {
  await captureStartupOutcome();
});

Then("the backend reports healthy after connecting", async () => {
  expect(healthStatus).toBe(200);
});

Then("the messaging status endpoint reports the failure", async () => {
  expect(messagingStatus).toBe("failed: NATS unavailable at startup");
});

Then("the health endpoint still reports healthy", async () => {
  expect(healthStatus).toBe(200);
});

Then("the messaging status surface reports the demo delivered and acked", async () => {
  expect(messagingStatus).toBe("delivered_and_acked");
});
