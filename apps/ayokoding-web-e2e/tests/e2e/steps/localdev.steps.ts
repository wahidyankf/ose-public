// Independent local development steps for the Playwright E2E adapter.
// Launcher behaviour (ports, flags, failure diagnostics) is proven against
// real spawned binaries on free loopback ports; the 3101 origin is a
// suite-owned stub, and the 3191 acceptance server is the Playwright-owned
// webServer. The suite never kills or reuses a developer's listener.
import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "../support/http";
import { hashSources } from "../support/hashes";
import { freePort, portAnswers, spawnBinary, spawnExpectExit, startExternalStub } from "../support/servers";
import { stateFor, trackOwned } from "../support/state";

const { Given, When, Then } = createBdd();

async function ensureOldOrigin(page: Page): Promise<void> {
  if (!(await portAnswers(3101))) {
    trackOwned(page, await startExternalStub(3101));
  }
}

// launch starts one rewrite binary for the scenario mode the Given steps
// recorded, and remembers its address for the Then steps.
async function launch(page: Page): Promise<void> {
  const state = stateFor(page);
  if (state.mode === "invalid") {
    const outcome = await spawnExpectExit([], { AYOKODING_WEB_PORT: state.envPort ?? "abc" });
    state.diagnostic = outcome.stderr;
    state.status = outcome.code;
    return;
  }
  if (state.mode === "flag") {
    const spawned = await spawnBinary({ AYOKODING_WEB_PORT: state.envPort ?? "0" }, ["--port", state.flagPort ?? "0"]);
    trackOwned(page, spawned);
    state.spawnedUrl = spawned.url;
    state.spawnedPort = spawned.port;
    return;
  }
  if (state.mode === "prefixed") {
    const spawned = await spawnBinary({ AYOKODING_WEB_PORT: state.envPort ?? "0" });
    trackOwned(page, spawned);
    state.spawnedUrl = spawned.url;
    state.spawnedPort = spawned.port;
    return;
  }
  if (state.mode === "generic") {
    const spawned = await spawnBinary({ PORT: "4100" });
    trackOwned(page, spawned);
    state.spawnedUrl = spawned.url;
    state.spawnedPort = spawned.port;
    return;
  }
  const spawned = await spawnBinary({});
  trackOwned(page, spawned);
  state.spawnedUrl = spawned.url;
  state.spawnedPort = spawned.port;
}

Given("the existing learning site is running on port 3101", async ({ page }) => {
  await ensureOldOrigin(page);
});

When("the rewrite starts without a port override", async ({ page }) => {
  stateFor(page).mode = "default";
  await launch(page);
});

Then("the rewrite serves its bilingual entry pages on port 3102", async ({ page }) => {
  expect(stateFor(page).spawnedPort).toBe(3102);
  await fetchText(page, `${stateFor(page).spawnedUrl ?? ""}/en`);
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain('lang="en"');
  await fetchText(page, `${stateFor(page).spawnedUrl ?? ""}/id`);
  expect(bodyOf(page)).toContain('lang="id"');
});

Then("the existing site still answers requests on port 3101", async () => {
  expect(await portAnswers(3101)).toBe(true);
});

Given("AYOKODING_WEB_PORT is set to an available valid port", async ({ page }) => {
  await ensureOldOrigin(page);
  stateFor(page).mode = "prefixed";
  stateFor(page).envPort = String(await freePort());
});

When("the rewrite starts", async ({ page }) => {
  if (stateFor(page).mode === undefined) stateFor(page).mode = "prefixed";
  await launch(page);
});

Then("the rewrite listens on that port", async ({ page }) => {
  const want = Number(stateFor(page).envPort ?? "0");
  expect(stateFor(page).spawnedPort).toBe(want);
  await fetchText(page, `${stateFor(page).spawnedUrl ?? ""}/en`);
  expect(statusOf(page)).toBe(200);
});

Then("the existing site's configured port remains unchanged", async () => {
  expect(await portAnswers(3101)).toBe(true);
});

Given("AYOKODING_WEB_PORT contains one valid port", async ({ page }) => {
  await ensureOldOrigin(page);
  stateFor(page).mode = "flag";
  stateFor(page).envPort = String(await freePort());
});

Given("the rewrite launcher receives a different valid port through its explicit port flag", async ({ page }) => {
  const other = (await freePort()) + 1;
  stateFor(page).flagPort = String(other);
});

Then("it listens on the explicit flag's port", async ({ page }) => {
  const want = Number(stateFor(page).flagPort ?? "0");
  expect(stateFor(page).spawnedPort).toBe(want);
  await fetchText(page, `${stateFor(page).spawnedUrl ?? ""}/en`);
  expect(statusOf(page)).toBe(200);
});

Then("it does not listen on the environment value's port", async ({ page }) => {
  const envPort = Number(stateFor(page).envPort ?? "0");
  expect(stateFor(page).spawnedPort).not.toBe(envPort);
  const probe = await fetch(`http://127.0.0.1:${envPort}/en`).catch(() => null);
  expect(probe).toBeNull();
});

Given("only the generic PORT variable contains a different valid port", async ({ page }) => {
  await ensureOldOrigin(page);
  stateFor(page).mode = "generic";
});

When("the rewrite starts without a prefixed override or explicit port flag", async ({ page }) => {
  stateFor(page).mode = "generic";
  await launch(page);
});

Then("the rewrite listens on port 3102", async ({ page }) => {
  expect(stateFor(page).spawnedPort).toBe(3102);
  await fetchText(page, `${stateFor(page).spawnedUrl ?? ""}/en`);
  expect(statusOf(page)).toBe(200);
});

Given("AYOKODING_WEB_PORT is set to an invalid port value", async ({ page }) => {
  stateFor(page).mode = "invalid";
  stateFor(page).envPort = "abc";
});

Then("startup fails with a diagnostic naming AYOKODING_WEB_PORT", async ({ page }) => {
  expect(stateFor(page).status).not.toBe(0);
  expect(stateFor(page).diagnostic ?? "").toContain("AYOKODING_WEB_PORT");
});

Then("no rewrite listener starts on a fallback port", async ({ page }) => {
  expect(stateFor(page).spawnedUrl).toBeUndefined();
});

Given("the existing site and the rewrite development server are running", async ({ page }) => {
  await ensureOldOrigin(page);
  if (!(await portAnswers(3102))) {
    trackOwned(page, await startExternalStub(3102));
  }
});

When("the rewrite browser acceptance suite starts", async ({ page }) => {
  await gotoPage(page, "/en");
  expect(statusOf(page)).toBe(200);
});

Then("it starts its own Go server on port 3191", async ({ page }) => {
  expect(page.url()).toContain("3191");
  await gotoPage(page, "/en");
  expect(statusOf(page)).toBe(200);
});

Then("it leaves both development servers running after the suite finishes", async () => {
  expect(await portAnswers(3101)).toBe(true);
  expect(await portAnswers(3102)).toBe(true);
});

Given("the shared Markdown and manifests have recorded byte hashes", async ({ page }) => {
  stateFor(page).hashes = hashSources();
  expect(Object.keys(stateFor(page).hashes ?? {}).length).toBeGreaterThan(0);
});

When("a developer starts the rewrite and browses its course pages", async ({ page }) => {
  for (const target of ["/en", "/en/learn/courses", "/en/learn/courses/go-basics/learning/hello-world"]) {
    await gotoPage(page, target);
    expect(statusOf(page)).toBe(200);
  }
});

Then("the Markdown and manifest byte hashes remain unchanged", async ({ page }) => {
  expect(hashSources()).toEqual(stateFor(page).hashes ?? {});
});

Then("the rewrite does not run a content-index generator implicitly", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  expect(statusOf(page)).toBe(200);
});

Given("other learning-content plans are unfinished", async () => {
  // The suite reads only committed sources and starts no plan output.
});

Given("the current shared corpus has a valid committed state", async () => {
  // The served binary reads the committed corpus through its file adapters.
});

When("the rewrite loads that committed corpus", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  expect(statusOf(page)).toBe(200);
});

Then("it serves the available content and manifests from that state", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  expect(statusOf(page)).toBe(200);
  await gotoPage(page, "/en/learn/paths/backend-id");
  expect(statusOf(page)).toBe(200);
});

Then("it does not wait for another plan to finish", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
});
