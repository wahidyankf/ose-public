// @scenario specs/apps/organiclever/be/behaviours/messaging/nats-config.feature: organiclever-be fails fast when its NATS URL is missing

import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

let childEnvironment: NodeJS.ProcessEnv = {};
let startupResult: SpawnSyncReturns<string> | undefined;

Given("ORGANICLEVER_BE_NATS_URL is unset", async () => {
  childEnvironment = { ...process.env, ORGANICLEVER_BE_NATS_URL: "" };
  expect(childEnvironment["ORGANICLEVER_BE_NATS_URL"]).toBe("");
});

When("organiclever-be reads its messaging configuration", async () => {
  startupResult = spawnSync(
    "dotnet",
    [
      "run",
      "--project",
      "../organiclever-be/src/OrganicleverBe/OrganicleverBe.fsproj",
      "--no-build",
      "--configuration",
      "Release",
    ],
    { cwd: process.cwd(), env: childEnvironment, encoding: "utf8", timeout: 30_000 },
  );
});

Then("startup aborts with a clear missing-variable error", async () => {
  expect(startupResult).toBeDefined();
  expect(startupResult!.status).not.toBe(0);
  expect(`${startupResult!.stdout}\n${startupResult!.stderr}`).toContain("ORGANICLEVER_BE_NATS_URL");
});
