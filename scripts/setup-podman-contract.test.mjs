// Contract for the Podman setup action and the two image-publication paths. scripts/ imports no YAML parser, so these
// are text assertions in the style of workflow-container-lookup.test.mjs. They check the reviewed runner-tuple pin row,
// the rootless and explicit-provider assertions, the absence of Docker actions, Docker commands and Buildx, and the
// podman login/build/push argv. Triggers, permissions, GHCR image names, tags and caller image inputs are compared with
// the constants below, not with git, so the test needs no origin/main in the checkout.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const REPO = resolve(import.meta.dirname, "..");
const ACTION = ".github/actions/setup-podman/action.yml";
const PUBLISH = ".github/workflows/publish-images.yml";
const REUSABLE = ".github/workflows/_reusable-be-build-deploy.yml";
const CALLERS = [
  ".github/workflows/organiclever-be-build-deploy-stag.yml",
  ".github/workflows/ose-be-build-deploy-stag.yml",
];
const PODMAN_FILES = [ACTION, PUBLISH, REUSABLE];
const PUBLISH_FILES = [PUBLISH, REUSABLE];
const NON_PRODUCT = ".github/workflows/non-product-full-quality.yml";
const PODMAN_STEP = "      - uses: ./.github/actions/setup-podman";

// Pins the pre-migration externally visible contract (names, tags, triggers, permissions), captured once from origin/main.
const PINNED_ON = {
  [PUBLISH]: ["on:", "  push:", "    branches: [main]"].join("\n"),
  [REUSABLE]: `on:
  workflow_call:
    inputs:
      be-project:
        required: true
        type: string
      image-name:
        required: true
        type: string
      environment:
        required: false
        type: string
        default: ""`,
};
const PINNED_PERMISSIONS = `permissions:
  contents: read
  packages: write`;
const PINNED_TAGS = {
  [PUBLISH]: [
    "ghcr.io/wahidyankf/organiclever-be:latest",
    "ghcr.io/wahidyankf/organiclever-be:${{ github.sha }}",
    "ghcr.io/wahidyankf/ose-be:latest",
    "ghcr.io/wahidyankf/ose-be:${{ github.sha }}",
  ],
  [REUSABLE]: ["${{ inputs.image-name }}:latest", "${{ inputs.image-name }}:${{ github.sha }}"],
};
const PINNED_CALLER_IMAGES = {
  ".github/workflows/organiclever-be-build-deploy-stag.yml": ["ghcr.io/wahidyankf/organiclever-be"],
  ".github/workflows/ose-be-build-deploy-stag.yml": ["ghcr.io/wahidyankf/ose-be"],
};

const LOGIN_LINE =
  /^[ \t]*printf '%s' "\$REGISTRY_TOKEN" \| podman login ghcr\.io --username "\$REGISTRY_ACTOR" --password-stdin --authfile "\$auth_file"$/;
const BUILD_LINE = /^[ \t]*podman build --layers --format docker -f apps\/.+\/Dockerfile \\$/;
const CLEANUP = /if: always\(\)\n[ \t]+run: rm -f "\$\{RUNNER_TEMP\}\/ghcr-auth\.json"/g;
const IMAGE_TAG = /(ghcr\.io\/[\w./-]+|\$\{\{ inputs\.image-name \}\}):(latest|\$\{\{ github\.sha \}\})/g;
const DOCKER_COMMAND = /(^|[\s;&|(`$])docker(\s|$)/;

function read(path) {
  return readFileSync(join(REPO, path), "utf8");
}

// The top-level block for `key`: its header line plus every following indented or blank line.
function topLevelBlock(text, key) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line === `${key}:` || line.startsWith(`${key}: `));
  assert.notEqual(start, -1, `no top-level ${key}: block`);
  const block = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (line !== "" && !/^\s/.test(line)) break;
    block.push(line);
  }
  return block.join("\n").trimEnd();
}

function commandLines(text) {
  return text.split("\n").filter((line) => !/^\s*#/.test(line));
}

function dockerCommands(text) {
  return commandLines(text)
    .map((line) => line.replace(/--format\s+docker\b/g, ""))
    .filter((line) => DOCKER_COMMAND.test(line));
}

function imageTags(text) {
  return [...text.matchAll(IMAGE_TAG)].map((match) => match[0]).sort();
}

function callerImages(text) {
  return [...text.matchAll(/^[ \t]+image-name:[ \t]+(\S+)[ \t]*$/gm)].map((match) => match[1]);
}

// The lines of one job under the top-level jobs: map: its header line plus every following line up to the next job.
function jobLines(text, job) {
  const lines = text.split("\n");
  const start = lines.indexOf(`  ${job}:`);
  assert.notEqual(start, -1, `no job ${job}`);
  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (/^  \S/.test(line) || (line !== "" && !/^\s/.test(line))) break;
    block.push(line);
  }
  return block;
}

test("setup-podman pins one reviewed Podman row for ubuntu/resolute/amd64 and refuses every other tuple", () => {
  const action = read(ACTION);
  assert.match(action, /ubuntu\/resolute\/amd64\)\n(?:[ \t]*#[^\n]*\n)*[ \t]+podman_pin="[^"]+"/);
  assert.equal(action.match(/podman_pin="/g)?.length ?? 0, 1, "exactly one reviewed pin row");
  assert.match(action, /\*\)\n\s+echo "::error::No reviewed Podman pin for runner tuple/);
});

test("setup-podman asserts a rootless engine and the explicit podman-compose 1.6.0 provider", () => {
  const action = read(ACTION);
  for (const needle of [
    "podman info --format json | jq -e '.host.security.rootless == true'",
    'grep -Fxq "podman-compose version 1.6.0" <<< "$version"',
    'test "$PODMAN_COMPOSE_PROVIDER" = "$(command -v podman-compose)"',
    'echo "PODMAN_COMPOSE_PROVIDER=$(command -v podman-compose)" >> "$GITHUB_ENV"',
    'pipx install --python "$(command -v python3)" podman-compose==1.6.0',
  ]) {
    assert.ok(action.includes(needle), `setup-podman lacks: ${needle}`);
  }
});

test("setup-podman checks the Ubuntu candidate, its archive origin and the installed Podman against the pin", () => {
  const action = read(ACTION);
  for (const needle of [
    'if [ "$candidate" != "$PODMAN_PIN" ]',
    'grep -Eq "${VERSION_CODENAME}/universe ${arch}(v[0-9])? Packages" <<< "$origins"',
    'if [ "$installed" != "$PODMAN_PIN" ]',
  ]) {
    assert.ok(action.includes(needle), `setup-podman lacks: ${needle}`);
  }
});

for (const path of PODMAN_FILES) {
  test(`${path} uses no Docker action, no docker command and no Buildx`, () => {
    const text = read(path);
    assert.deepEqual(
      text.split("\n").filter((line) => /uses:\s*docker\//.test(line)),
      [],
      "Docker actions must not be used",
    );
    assert.deepEqual(dockerCommands(text), [], "docker command lines must not remain");
    assert.deepEqual(
      commandLines(text).filter((line) => /buildx/i.test(line)),
      [],
      "Buildx must not be used",
    );
  });
}

for (const path of PUBLISH_FILES) {
  test(`${path} logs in only with --password-stdin and an ephemeral auth file, and removes that file`, () => {
    const text = read(path);
    const logins = commandLines(text).filter((line) => /podman login/.test(line));
    assert.ok(logins.length > 0, "at least one podman login step");
    assert.equal(
      logins.filter((line) => LOGIN_LINE.test(line)).length,
      logins.length,
      "every login must pipe the token to --password-stdin with --authfile",
    );
    assert.doesNotMatch(text, /podman login[^\n]*--password(?!-stdin)/, "no login may pass the password as argv");
    assert.equal(
      text.match(CLEANUP)?.length ?? 0,
      logins.length,
      "each login job removes its auth file under if: always()",
    );
    assert.equal(
      text.match(/uses: \.\/\.github\/actions\/setup-podman$/gm)?.length ?? 0,
      logins.length,
      "each publishing job installs Podman through the setup action",
    );
  });

  test(`${path} builds with podman build --layers --format docker and pushes every tag it builds`, () => {
    const text = read(path);
    const builds = commandLines(text).filter((line) => /podman build/.test(line));
    assert.equal(
      builds.filter((line) => BUILD_LINE.test(line)).length,
      builds.length,
      "every build must use the exact podman build argv",
    );
    assert.equal(
      builds.length,
      commandLines(text).filter((line) => /podman login/.test(line)).length,
      "each login has one build",
    );
    const tags = [...text.matchAll(/^[ \t]*-t (.+?) \\$/gm)].map((match) => match[1]).sort();
    const pushes = [...text.matchAll(/^[ \t]*podman push --authfile "\$auth_file" (.+?)[ \t]*$/gm)]
      .map((match) => match[1])
      .sort();
    assert.equal(tags.length, 2 * builds.length, "each build tags :latest and :<sha>");
    assert.deepEqual(pushes, tags, "each built tag is pushed once with the auth file");
  });
}

for (const path of PUBLISH_FILES) {
  test(`${path} keeps the pinned triggers and permissions`, () => {
    const text = read(path);
    assert.equal(topLevelBlock(text, "on"), PINNED_ON[path], "triggers changed");
    assert.equal(topLevelBlock(text, "permissions"), PINNED_PERMISSIONS, "permissions changed");
  });

  test(`${path} keeps the pinned GHCR image names and tags`, () => {
    assert.deepEqual([...new Set(imageTags(read(path)))], [...PINNED_TAGS[path]].sort());
  });
}

test("the caller workflows keep their pinned image-name inputs", () => {
  for (const path of CALLERS) {
    assert.deepEqual(callerImages(read(path)), PINNED_CALLER_IMAGES[path], path);
  }
});

test(`${NON_PRODUCT} installs Podman once in the e2e job before the test:e2e run, and not in integration`, () => {
  const text = read(NON_PRODUCT);
  const e2e = jobLines(text, "e2e");
  assert.equal(
    e2e.filter((line) => line === PODMAN_STEP).length,
    1,
    "the e2e job must install Podman through the setup action exactly once, so the ayokoding-cli adapter finds podman-compose",
  );
  const run = e2e.findIndex((line) => /nx run-many -t test:e2e\b/.test(line));
  assert.notEqual(run, -1, "the e2e job must run nx run-many -t test:e2e");
  assert.ok(
    e2e.indexOf(PODMAN_STEP) < run,
    "setup-podman must come before the first step that runs nx run-many -t test:e2e",
  );
  assert.ok(
    !jobLines(text, "integration").includes(PODMAN_STEP),
    "the integration job must not install Podman: its adapter uses a fake container CLI",
  );
});
