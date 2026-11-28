// Parity tools steps for the Playwright E2E adapter. The owner's commands run
// through the process boundary: `go -C apps/ayokoding-web run ./cmd/parity`
// from the repository root, against checked-in fixtures and, for the gap
// report, the real-corpus server that the Playwright webServer owns on 3191.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then, After } = createBdd();

// Behaviour corpus binding (contract C13). The Playwright home runs the whole
// parity-tools feature; no scenario here is exempt.
// @scenario specs/apps/ayokoding/web/behaviours/parity-tools/parity-tools.feature: *

// The repository root is five directories above this steps folder:
// apps/ayokoding-web-fe-e2e/tests/e2e/steps -> repository root.
const repoRoot = path.resolve(__dirname, "../../../../..");
const fixtures = "apps/ayokoding-web/tests/fixtures/parity-tools";
const commandTimeoutMs = 120000;

type CommandResult = { code: number; stdout: string; stderr: string };

// runParity runs one parity subcommand from the repository root and reports its
// exit code and both output streams. It never retries.
function runParity(args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("go", ["-C", "apps/ayokoding-web", "run", "./cmd/parity", ...args], {
      cwd: repoRoot,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`parity ${args[0]} exceeded ${commandTimeoutMs} ms`));
    }, commandTimeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (exitCode) => {
      clearTimeout(timer);
      resolve({ code: exitCode ?? 0, stdout, stderr });
    });
  });
}

// The scenario's latest command and the file it wrote, read by its Then steps.
let lastRun: CommandResult | undefined;
let writtenInventory: string | undefined;
let scratchDir: string | undefined;

After(() => {
  if (scratchDir) {
    rmSync(scratchDir, { recursive: true, force: true });
  }
  scratchDir = undefined;
});

function reportRowFor(url: string): string {
  const row = (lastRun?.stdout ?? "").split("\n").find((line) => line.includes(`| ${url} |`));
  expect(row, `the gap report has a row for ${url}`).toBeDefined();
  return row as string;
}

Given("the old site's sitemap has three entries, one of them a repeat of another", async () => {
  lastRun = undefined;
  writtenInventory = undefined;
});

When("the URL inventory command runs over the sitemap", async () => {
  scratchDir = mkdtempSync(path.join(os.tmpdir(), "parity-inventory-"));
  writtenInventory = path.join(scratchDir, "inventory.json");
  lastRun = await runParity([
    "inventory",
    "--sitemap",
    `${fixtures}/sitemap.xml`,
    "--source-revision",
    "fixture-rev",
    "--out",
    writtenInventory,
  ]);
});

Then("the inventory lists each page address once, in sorted order", async () => {
  expect(lastRun?.code, lastRun?.stderr).toBe(0);
  expect(existsSync(writtenInventory ?? ""), "the inventory file is written").toBe(true);
  const inventory = JSON.parse(readFileSync(writtenInventory as string, "utf8")) as { urls: string[] };
  const urls = inventory.urls;
  expect(urls).toEqual([...new Set(urls)].sort());
  expect(urls).toEqual(expect.arrayContaining(["/en", "/en/browse"]));
  expect(urls.filter((url) => url === "/en")).toHaveLength(1);
});

Then("no inventory entry names a host", async () => {
  expect(existsSync(writtenInventory ?? ""), "the inventory file is written").toBe(true);
  expect(readFileSync(writtenInventory as string, "utf8")).not.toContain("://");
});

Given("an inventory lists a page that answers 200 and a page that answers 404", async () => {
  lastRun = undefined;
  writtenInventory = undefined;
});

When("the gap report runs against the base address", async ({ baseURL }) => {
  lastRun = await runParity([
    "gap-report",
    "--inventory",
    `${fixtures}/inventory.json`,
    "--base-url",
    baseURL ?? "http://localhost:3191",
  ]);
});

Then("the page that answers 200 is classified as passing", async () => {
  expect(lastRun?.code, lastRun?.stderr).toBe(0);
  expect(reportRowFor("/en")).toContain("| 200 | pass |");
});

Then("the page that answers 404 is classified as failing and grouped under its cause", async () => {
  expect(reportRowFor("/en/does-not-exist")).toContain("| 404 | fail | no tree route |");
});

Then("no redirect is followed", async () => {
  const rows = (lastRun?.stdout ?? "").split("\n").filter((line) => line.startsWith("| /"));
  expect(rows).toHaveLength(2);
});
