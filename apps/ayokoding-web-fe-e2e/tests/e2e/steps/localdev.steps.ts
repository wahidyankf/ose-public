// Independent local development steps for the Playwright E2E adapter.
// Launcher behaviour (ports, flags, failure diagnostics) is proven against
// real spawned binaries on free loopback ports; the 3101 origin is a
// suite-owned stub, and the 3191 acceptance server is the Playwright-owned
// webServer. The suite never kills or reuses a developer's listener.
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "../support/http";
import { hashSources } from "../support/hashes";
import { primaryPage } from "../support/witness";
import { freePort, portAnswers, spawnBinary, spawnExpectExit, startExternalStub } from "../support/servers";
import { stateFor, trackOwned } from "../support/state";

const { Given, When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The Playwright home runs the whole
// local-development feature; no scenario here is exempt.
// @scenario specs/apps/ayokoding/web/behaviours/local-development/local-development.feature: *

// corpusFiles mirrors the Go unit corpus: one lesson, one course, one path.
const corpusFiles: Record<string, string> = {
  "content/en/learn/courses/go-basics/learning/hello-world.md":
    "---\ntitle: Hello World\ndescription: First program\nweight: 1\n---\n\n# Hello\n\nServed from disk.\n",
  "content/en/learn/courses/go-basics/_index.md":
    "---\ntitle: Go Basics\ndescription: Learn Go\ncategory: fundamentals\nformat: course\nestimatedHours: 4\n---\n\nCourse index.\n",
  "manifests/careers/backend.json":
    '{\n  "pathId": "careers/backend",\n  "title": "Backend",\n  "phases": [{"id": "fundamentals", "title": "Fundamentals", "courses": ["go-basics"]}]\n}',
};

// The htmx fragment targets the fragment scenario requests.
const htmxFragments = ["/htmx/search?q=hello", "/htmx/benchmark", "/htmx/calculator"];

async function ensureOldOrigin(page: Page): Promise<void> {
  if (!(await portAnswers(3101))) {
    trackOwned(page, await startExternalStub(3101));
  }
}

// launch starts one rewrite binary for the scenario mode the Given steps
// recorded, and remembers its address for the Then steps. The launch makes a
// single attempt; a bind collision fails it loudly.
async function launch(page: Page): Promise<void> {
  const state = stateFor(page);
  if (state.mode === "invalid") {
    const outcome = await spawnExpectExit([], { AYOKODING_WEB_PORT: state.envPort ?? "abc" });
    state.diagnostic = outcome.stderr;
    state.status = outcome.code;
    return;
  }
  if (state.mode === "corpus") {
    const spawned = await spawnBinary({ ...state.corpusEnv, AYOKODING_WEB_PORT: state.envPort ?? "0" });
    trackOwned(page, spawned);
    state.spawnedUrl = spawned.url;
    state.spawnedPort = spawned.port;
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
  const taken = Number(stateFor(page).envPort ?? "0");
  let other = await freePort();
  while (other === taken) {
    other = await freePort();
  }
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

Given("the shared Markdown and manifests have recorded byte hashes", async ({ page }) => {
  stateFor(page).hashes = hashSources();
  expect(Object.keys(stateFor(page).hashes ?? {}).length).toBeGreaterThan(0);
});

When("a developer starts the rewrite and browses its course pages", async ({ page }) => {
  for (const target of ["/en", "/en/learn/courses", primaryPage(0).route]) {
    await gotoPage(page, target);
    expect(statusOf(page)).toBe(200);
  }
});

Then("the Markdown and manifest byte hashes remain unchanged", async ({ page }) => {
  expect(hashSources()).toEqual(stateFor(page).hashes ?? {});
});

Given("AYOKODING_WEB_CONTENT_DIR and AYOKODING_WEB_MANIFESTS_DIR name another corpus root", async ({ page }) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "ayokoding-web-corpus-"));
  trackOwned(page, {
    port: 0,
    close: async () => rmSync(root, { recursive: true, force: true }),
  });
  for (const [relative, body] of Object.entries(corpusFiles)) {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  }
  stateFor(page).mode = "corpus";
  stateFor(page).corpusEnv = {
    AYOKODING_WEB_CONTENT_DIR: path.join(root, "content"),
    AYOKODING_WEB_MANIFESTS_DIR: path.join(root, "manifests"),
  };
  stateFor(page).envPort = String(await freePort());
});

Then("the rewrite serves its pages and course paths from that corpus", async ({ page }) => {
  const base = stateFor(page).spawnedUrl ?? "";
  await fetchText(page, `${base}/en/learn/courses/go-basics/learning/hello-world`);
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("Served from disk.");
  await fetchText(page, `${base}/en/learn/paths/careers/backend`);
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("Backend");
});

When("a reader requests the search, benchmark, and calculator fragments", async ({ page }) => {
  const replies: { target: string; status: number; body: string }[] = [];
  for (const target of htmxFragments) {
    await fetchText(page, target);
    replies.push({ target, status: statusOf(page), body: bodyOf(page) });
  }
  stateFor(page).fragments = replies;
});

Then("each fragment returns results without the page layout", async ({ page }) => {
  const replies = stateFor(page).fragments ?? [];
  expect(replies.length).toBe(htmxFragments.length);
  for (const reply of replies) {
    expect(reply.status, reply.target).toBe(200);
    expect(reply.body, reply.target).not.toContain("<html");
    expect(reply.body.trim(), reply.target).not.toBe("");
  }
});

When("the rewrite starts with the argument {string}", async ({ page }, argument: string) => {
  const outcome = await spawnExpectExit([argument], {});
  stateFor(page).status = outcome.code;
  stateFor(page).diagnostic = outcome.stderr;
});

Then("startup fails with a message naming {string}", async ({ page }, naming: string) => {
  expect(stateFor(page).status).not.toBe(0);
  expect(stateFor(page).diagnostic ?? "").toContain(naming);
});

When(
  "the rewrite starts with the {string} fixture set by {string}",
  async ({ page }, fixture: string, channel: string) => {
    const env: Record<string, string> = { AYOKODING_WEB_PORT: String(await freePort()) };
    let args: string[] = [];
    if (channel === "--fixture flag") {
      args = ["--fixture", fixture];
    } else if (channel === "AYOKODING_WEB_FIXTURE") {
      env["AYOKODING_WEB_FIXTURE"] = fixture;
    } else {
      throw new Error(`unknown fixture channel ${channel}`);
    }
    const spawned = await spawnBinary(env, args);
    trackOwned(page, spawned);
    stateFor(page).spawnedUrl = spawned.url;
    stateFor(page).spawnedPort = spawned.port;
  },
);

Then("the course catalog answers with status {string}", async ({ page }, status: string) => {
  await fetchText(page, `${stateFor(page).spawnedUrl ?? ""}/en/learn/courses`);
  expect(statusOf(page)).toBe(Number(status));
});

// The unreadable root is a directory with no permissions, which the launcher must refuse before it opens a listener.
// The scenario removes it when it closes, restoring its permissions first.
Given("AYOKODING_WEB_CONTENT_DIR names a content directory that cannot be read", async ({ page }) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "ayokoding-web-unreadable-"));
  chmodSync(root, 0o000);
  trackOwned(page, {
    port: 0,
    close: async () => {
      chmodSync(root, 0o755);
      rmSync(root, { recursive: true, force: true });
    },
  });
  stateFor(page).corpusEnv = { AYOKODING_WEB_CONTENT_DIR: root };
});

When("the rewrite is launched and fails to start", async ({ page }) => {
  const outcome = await spawnExpectExit([], {
    ...stateFor(page).corpusEnv,
    AYOKODING_WEB_PORT: String(await freePort()),
  });
  stateFor(page).status = outcome.code;
  stateFor(page).diagnostic = outcome.stderr;
});

Then("startup fails with a diagnostic naming AYOKODING_WEB_CONTENT_DIR", async ({ page }) => {
  expect(stateFor(page).status).not.toBe(0);
  expect(stateFor(page).diagnostic ?? "").toContain("AYOKODING_WEB_CONTENT_DIR");
});

Then("no rewrite listener starts", async ({ page }) => {
  expect(stateFor(page).spawnedUrl).toBeUndefined();
});
