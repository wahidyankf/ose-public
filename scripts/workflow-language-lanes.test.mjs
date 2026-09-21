// A language lane in the PR quality gate must run its own language and nothing else, and the
// repository-policy job must carry a toolchain for every language whose files the staged formatter
// touches. Both invariants broke silently when this repository gained its first Python projects: the
// other lanes kept running FERRET targets without `uv`, and the policy job could not run `ruff`.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const WORKFLOW = ".github/workflows/pr-quality-gate.yml";
const POLICY_JOB = "repository-policy";

// Language tags the repository actually declares, read from the projects rather than from the
// workflow: a lane that forgets a brand-new language is exactly what this file exists to catch.
function declaredLanguageTags() {
  const output = execFileSync(
    "git",
    ["grep", "-h", "-o", "-E", '"lang:[a-z]+"', "--", "apps/**/project.json", "libs/**/project.json"],
    { encoding: "utf8" },
  );
  return new Set(
    output
      .split("\n")
      .filter(Boolean)
      .map((line) => line.replaceAll('"', "")),
  );
}

// One entry per job that runs `nx affected`, with the exclude lists it passes.
function lanes(workflow) {
  const found = new Map();
  let job = null;
  for (const line of workflow.split("\n")) {
    const header = /^ {2}([a-z][a-z0-9-]*):\s*$/.exec(line);
    if (header) job = header[1];
    const exclude = /--exclude='([^']*)'/.exec(line);
    if (job && exclude) {
      if (!found.has(job)) found.set(job, []);
      found.get(job).push(new Set(exclude[1].split(",").filter(Boolean)));
    }
  }
  return found;
}

function setupActions(workflow, jobName) {
  const actions = new Set();
  let job = null;
  for (const line of workflow.split("\n")) {
    const header = /^ {2}([a-z][a-z0-9-]*):\s*$/.exec(line);
    if (header) job = header[1];
    const uses = /uses:\s*\.\/\.github\/actions\/setup-([a-z]+)\s*$/.exec(line);
    if (job === jobName && uses) actions.add(uses[1]);
  }
  return actions;
}

test("every language lane excludes every language but its own", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const declared = declaredLanguageTags();
  assert.ok(declared.size > 1, "expected the repository to declare more than one language tag");

  for (const [job, excludeLists] of lanes(workflow)) {
    const own = `lang:${job === "typescript" ? "ts" : job}`;
    if (!declared.has(own)) continue; // a lane for a language no project declares yet

    for (const excluded of excludeLists) {
      const missing = [...declared].filter((tag) => tag !== own && !excluded.has(`tag:${tag}`));
      assert.deepEqual(
        missing,
        [],
        `${WORKFLOW}: the ${job} lane does not exclude ${missing.join(", ")}, so it would run those ` +
          "projects without their toolchain",
      );
      assert.ok(
        !excluded.has(`tag:${own}`),
        `${WORKFLOW}: the ${job} lane excludes its own ${own}, so it would run nothing`,
      );
    }
  }
});

test("the repository policy job sets up every language the staged formatter formats", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const formatter = readFileSync("scripts/format-staged", "utf8");
  const present = setupActions(workflow, POLICY_JOB);

  // Only languages that have a composite action to begin with can be required here.
  const available = new Set(
    execFileSync("git", ["ls-files", "--", ".github/actions"], { encoding: "utf8" })
      .split("\n")
      .map((path) => /^\.github\/actions\/setup-([a-z]+)\//.exec(path)?.[1])
      .filter(Boolean),
  );

  for (const tag of declaredLanguageTags()) {
    const language = tag.slice("lang:".length);
    if (!available.has(language)) continue;
    // The formatter names the language only when it has a formatter for its files.
    if (!formatter.includes(`${language}_paths`)) continue;
    assert.ok(
      present.has(language),
      `${WORKFLOW}: the ${POLICY_JOB} job has no setup-${language} step, so the pull-request surface ` +
        `cannot run the ${language} formatter that scripts/format-staged invokes`,
    );
  }
});

// A composite action is not always enough. prettier and ruff are installed into a project-local
// environment rather than onto PATH, so the policy job has to prepend that environment's bin
// directory before it runs the pull-request surface. Setting up Python without doing so is what let
// `format-staged` reach a bare `ruff` that only exists on a developer's own machine.
const PROJECT_LOCAL_FORMATTERS = [
  { binary: "prettier", bin: "node_modules/.bin" },
  { binary: "ruff", bin: "apps/ferret-cli/.venv/bin" },
];

test("the repository policy job puts every project-local formatter on PATH", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const formatter = readFileSync("scripts/format-staged", "utf8");

  let job = null;
  const jobLines = [];
  for (const line of workflow.split("\n")) {
    const header = /^ {2}([a-z][a-z0-9-]*):\s*$/.exec(line);
    if (header) job = header[1];
    if (job === POLICY_JOB) jobLines.push(line);
  }
  assert.ok(jobLines.length > 0, `${WORKFLOW}: no ${POLICY_JOB} job`);
  const jobText = jobLines.join("\n");

  for (const { binary, bin } of PROJECT_LOCAL_FORMATTERS) {
    // Only demand the PATH entry while the formatter still calls the binary bare.
    const callsBare = new RegExp(`(^|[^\\w/-])${binary} `, "m").test(formatter);
    if (!callsBare) continue;
    assert.ok(
      jobText.includes(bin),
      `${WORKFLOW}: the ${POLICY_JOB} job never puts ${bin} on PATH, so the pull-request surface ` +
        `cannot run the bare \`${binary}\` that scripts/format-staged invokes`,
    );
  }
});
