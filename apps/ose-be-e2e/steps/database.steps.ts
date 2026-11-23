// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Backend serves requests after starting against a database with pending migrations
// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Database status endpoint reports the migration state after startup
// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Backend aborts at startup with a clear error when DATABASE_URL is missing
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { assertBackendStopped, readJson, readStatus, resetDatabaseToPending, startBackend } from "./backend-process";

const { Given, When, Then } = createBdd();

let pendingBeforeStartup = false;
let childEnvironment: NodeJS.ProcessEnv = {};
let startupResult: SpawnSyncReturns<string> | undefined;

Given("a fresh test database has pending ose-be migrations", async () => {
  await assertBackendStopped();
  resetDatabaseToPending();
  pendingBeforeStartup = true;
});

When("ose-be starts against that database", async () => {
  await startBackend();
});

Then("ose-be reaches its public health endpoint after applying migrations", async () => {
  expect(pendingBeforeStartup).toBe(true);
  expect(await readJson("/api/v1/system/status/database")).toEqual({ migration_state: "applied" });
  expect(await readStatus("/api/v1/health")).toBe(200);
});

// oxlint-disable-next-line no-empty-pattern
Then("the database status endpoint reports the migration state {string}", async ({}, state: string) => {
  expect(pendingBeforeStartup).toBe(true);
  expect(await readJson("/api/v1/system/status/database")).toEqual({ migration_state: state });
});

Given("DATABASE_URL is unset", async () => {
  childEnvironment = { ...process.env, DATABASE_URL: "" };
  expect(childEnvironment["DATABASE_URL"]).toBe("");
});

When("ose-be reads its database configuration", async () => {
  startupResult = spawnSync(
    "dotnet",
    ["run", "--project", "../ose-be/src/OseBe/OseBe.fsproj", "--no-build", "--configuration", "Release"],
    { cwd: process.cwd(), env: childEnvironment, encoding: "utf8", timeout: 30_000 },
  );
});

Then("startup aborts with a clear error that names DATABASE_URL", async () => {
  expect(startupResult).toBeDefined();
  expect(startupResult!.status).not.toBe(0);
  expect(`${startupResult!.stdout}\n${startupResult!.stderr}`).toContain("DATABASE_URL");
});
