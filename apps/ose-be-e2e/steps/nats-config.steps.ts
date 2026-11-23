// @scenario specs/apps/ose/be/behaviours/messaging/nats-config.feature: ose-be fails fast when its NATS URL is missing
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

let childEnvironment: NodeJS.ProcessEnv = {};
let startupResult: SpawnSyncReturns<string> | undefined;

Given("OSE_BE_NATS_URL is unset", async () => {
  childEnvironment = { ...process.env, OSE_BE_NATS_URL: "" };
  expect(childEnvironment["OSE_BE_NATS_URL"]).toBe("");
});

When("ose-be reads its messaging configuration", async () => {
  startupResult = spawnSync(
    "dotnet",
    ["run", "--project", "../ose-be/src/OseBe/OseBe.fsproj", "--no-build", "--configuration", "Release"],
    { cwd: process.cwd(), env: childEnvironment, encoding: "utf8", timeout: 30_000 },
  );
});

Then("startup aborts with a clear missing-variable error", async () => {
  expect(startupResult).toBeDefined();
  expect(startupResult!.status).not.toBe(0);
  expect(`${startupResult!.stdout}\n${startupResult!.stderr}`).toContain("OSE_BE_NATS_URL");
});
