// @scenario specs/apps/organiclever/be/behaviours/db/migrations.feature: Backend serves requests after starting against a database with pending migrations
// @scenario specs/apps/organiclever/be/behaviours/db/migrations.feature: Database status endpoint reports the migration state after startup
// @scenario specs/apps/organiclever/be/behaviours/db/migrations.feature: Backend aborts at startup with a clear error when DATABASE_URL is missing

import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { assertBackendStopped, readJson, readStatus, resetDatabaseToPending, startBackend } from "./backend-process";

const { Given, When, Then } = createBdd();

let pendingBeforeStartup = false;
let databaseChildEnvironment: NodeJS.ProcessEnv = {};
let databaseStartupResult: SpawnSyncReturns<string> | undefined;

Given("a fresh test database has pending organiclever-be migrations", async () => {
  await assertBackendStopped();
  resetDatabaseToPending();
  pendingBeforeStartup = true;
});

When("organiclever-be starts against that database", async () => {
  await startBackend();
});

Then("organiclever-be reaches its public health endpoint after applying migrations", async () => {
  expect(pendingBeforeStartup).toBe(true);
  expect(await readJson("/api/v1/system/status/database")).toEqual({ migration_state: "applied" });
  expect(await readStatus("/api/v1/health")).toBe(200);
});

Then("the database status endpoint reports the migrations applied", async () => {
  expect(pendingBeforeStartup).toBe(true);
  expect(await readJson("/api/v1/system/status/database")).toEqual({ migration_state: "applied" });
});

Given("DATABASE_URL is unset", async () => {
  databaseChildEnvironment = { ...process.env, DATABASE_URL: "" };
  expect(databaseChildEnvironment["DATABASE_URL"]).toBe("");
});

When("organiclever-be reads its database configuration", async () => {
  databaseStartupResult = spawnSync(
    "dotnet",
    [
      "run",
      "--project",
      "../organiclever-be/src/OrganicleverBe/OrganicleverBe.fsproj",
      "--no-build",
      "--configuration",
      "Release",
    ],
    { cwd: process.cwd(), env: databaseChildEnvironment, encoding: "utf8", timeout: 30_000 },
  );
});

Then("startup aborts naming the DATABASE_URL variable", async () => {
  expect(databaseStartupResult).toBeDefined();
  expect(databaseStartupResult!.status).not.toBe(0);
  expect(`${databaseStartupResult!.stdout}\n${databaseStartupResult!.stderr}`).toContain("DATABASE_URL");
});
