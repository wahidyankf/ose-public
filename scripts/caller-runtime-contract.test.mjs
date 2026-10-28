// Fake-command contract for the supported callers that start a Podman Compose stack: the two backend E2E runners and
// the package.json container entry points. A runner is copied into a temporary root, so its ROOT-relative preflight
// resolves to a fake that logs its arguments and the provider it saw. podman, podman-compose, npx, dotnet and docker
// are fakes on a PATH that shadows the host binaries. docker is a tripwire: any invocation fails the run and the test.
// Not covered by fakes: a real Compose stack, the real Playwright or backend E2E run, and the real preflight (covered by
// container-runtime-check.test.mjs). The Playwright step helper that sets the provider for its own psql call is TypeScript
// and is not driven here.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const REPO = resolve(import.meta.dirname, "..");
const PACKAGE_SCRIPTS = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")).scripts;

const CALLERS = [
  {
    app: "ose-be",
    script: "apps/ose-be/scripts/run-e2e.sh",
    project: "ose-be-e2e",
    compose: "apps/ose-be/docker-compose.e2e.yml",
    e2eDir: "apps/ose-be-e2e",
    fsproj: "apps/ose-be/src/OseBe/OseBe.fsproj",
  },
  {
    app: "organiclever-be",
    script: "apps/organiclever-be/scripts/run-e2e.sh",
    project: "organiclever-be-e2e",
    compose: "apps/organiclever-be/docker-compose.e2e.yml",
    e2eDir: "apps/organiclever-be-e2e",
    fsproj: "apps/organiclever-be/src/OrganicleverBe/OrganicleverBe.fsproj",
  },
];

// package.json stacks that start a Compose project in the foreground. organiclever:dev:reset runs `down -v` on purpose,
// so only the provider, preflight-order and docker rules apply to it; the teardown rule is for E2E runners only.
const PACKAGE_STACKS = [
  "dev:ayokoding-www",
  "dev:ose-www",
  "dev:organiclever",
  "organiclever:dev",
  "organiclever:dev:reset",
];

const FAKES = {
  // Logs every call. `compose` dispatches only to a provider that is an executable inside FIXTURE_BIN, as a real
  // `podman compose` would dispatch to the selected provider; an unselected or unknown provider fails the call.
  podman: `echo "podman $* PCP=\${PODMAN_COMPOSE_PROVIDER-unset}" >> "$CALL_LOG"
if [ "$1" = compose ]; then
  shift
  provider="\${PODMAN_COMPOSE_PROVIDER-}"
  case "$provider" in
    "" | */*) echo "provider not selected" >&2; exit 125 ;;
  esac
  [ -x "$FIXTURE_BIN/$provider" ] || { echo "provider $provider not in fixture" >&2; exit 125; }
  exec "$FIXTURE_BIN/$provider" "$@"
fi
exit 0`,
  "podman-compose": `echo "provider $*" >> "$CALL_LOG"
exit 0`,
  docker: `echo "docker $*" >> "$CALL_LOG"
exit 99`,
  npx: `echo "npx $*" >> "$CALL_LOG"
if [ "$1" = bddgen ]; then exit 0; fi
if [ -n "\${E2E_HOLD_FILE-}" ]; then echo held > "$E2E_HOLD_FILE"; exec sleep 60; fi
exit "\${E2E_STATUS:-0}"`,
  dotnet: `echo "dotnet $*" >> "$CALL_LOG"
exit 0`,
};

const PREFLIGHT = `echo "preflight $* PCP=\${PODMAN_COMPOSE_PROVIDER-unset}" >> "$CALL_LOG"
exit "\${PREFLIGHT_STATUS:-0}"`;

const HIPPO = `echo "hippo $*" >> "$CALL_LOG"
while [ "$#" -gt 0 ] && [ "$1" != -- ]; do shift; done
[ "$#" -gt 0 ] && shift
exec "$@"`;

function writeExecutable(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
}

function makeFixture(prefix, { withHippo = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const bin = join(root, "bin");
  mkdirSync(bin);
  for (const [name, body] of Object.entries(FAKES)) writeExecutable(join(bin, name), body);
  writeExecutable(join(root, "scripts", "container-runtime-check"), PREFLIGHT);
  if (withHippo) writeExecutable(join(root, "hippo"), HIPPO);
  return { root, bin, log: join(root, "calls.log") };
}

function environment(f, extra = {}) {
  return { PATH: `${f.bin}:/usr/bin:/bin`, CALL_LOG: f.log, FIXTURE_BIN: f.bin, ...extra };
}

function callerFixture(caller) {
  const f = makeFixture("caller-");
  f.scriptPath = join(f.root, caller.script);
  mkdirSync(dirname(f.scriptPath), { recursive: true });
  copyFileSync(join(REPO, caller.script), f.scriptPath);
  mkdirSync(dirname(join(f.root, caller.compose)), { recursive: true });
  writeFileSync(join(f.root, caller.compose), "services: {}\n");
  mkdirSync(join(f.root, caller.e2eDir), { recursive: true });
  writeFileSync(join(f.root, caller.e2eDir, "placeholder.ts"), "export {};\n");
  mkdirSync(dirname(join(f.root, caller.fsproj)), { recursive: true });
  writeFileSync(join(f.root, caller.fsproj), "<Project />\n");
  return f;
}

function runCaller(f, env = {}) {
  return spawnSync("/bin/bash", [f.scriptPath], { encoding: "utf8", env: environment(f, env), timeout: 30_000 });
}

function calls(f) {
  return existsSync(f.log) ? readFileSync(f.log, "utf8").split("\n").filter(Boolean) : [];
}

const isPreflight = (line) => line.startsWith("preflight ");
const isCompose = (line) => line.startsWith("podman compose ");

function assertNoDocker(lines) {
  assert.deepEqual(
    lines.filter((line) => line.startsWith("docker ")),
    [],
    "docker must never be invoked",
  );
}

function assertOwnedTeardown(caller, f, lines) {
  const down = `podman compose -p ${caller.project} -f ${join(f.root, caller.compose)} down PCP=podman-compose`;
  const downIndex = lines.findLastIndex(isCompose);
  assert.equal(lines[downIndex], down, "the last compose call must be the owned project teardown");
  assert.ok(downIndex > lines.indexOf("npx playwright test"), "teardown must run after the E2E command");
  for (const line of lines.filter(isCompose)) {
    assert.doesNotMatch(line, /\s-v(\s|$)|--volumes|\bprune\b|\bvolume\b/, `destructive call: ${line}`);
  }
}

async function waitForFile(path) {
  const deadline = Date.now() + 10_000;
  while (!existsSync(path)) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${path}`);
    await new Promise((done) => setTimeout(done, 25));
  }
}

async function interruptedRun(f, caller, signal) {
  const holdFile = join(f.root, "held");
  // detached gives the runner its own process group, so the signal reaches it and its held E2E child as a terminal would.
  const child = spawn("/bin/bash", [f.scriptPath], {
    env: environment(f, { E2E_HOLD_FILE: holdFile }),
    detached: true,
    stdio: "ignore",
  });
  const exited = new Promise((done) => child.once("exit", (code, sig) => done({ code, signal: sig })));
  try {
    await waitForFile(holdFile);
    process.kill(-child.pid, signal);
    return await exited;
  } finally {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      // the group already exited
    }
  }
}

for (const caller of CALLERS) {
  test(`${caller.app} exports podman-compose before any compose call, overriding an ambient provider`, () => {
    const f = callerFixture(caller);
    try {
      const result = runCaller(f, { PODMAN_COMPOSE_PROVIDER: "docker-compose" });
      assert.equal(result.status, 0, result.stderr);
      const lines = calls(f);
      const seen = lines.filter((line) => isPreflight(line) || isCompose(line));
      assert.ok(seen.length > 0);
      for (const line of seen) assert.match(line, / PCP=podman-compose$/, line);
      assert.ok(
        lines.some((line) => line.startsWith("provider ")),
        "the selected provider must be the one invoked",
      );
      assertNoDocker(lines);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  test(`${caller.app} runs the runtime preflight before the first compose call`, () => {
    const f = callerFixture(caller);
    try {
      const result = runCaller(f);
      assert.equal(result.status, 0, result.stderr);
      const lines = calls(f);
      const preflight = lines.findIndex(isPreflight);
      assert.notEqual(preflight, -1, "the preflight must run");
      assert.equal(lines[preflight], "preflight --compose PCP=podman-compose");
      assert.equal(lines.filter(isPreflight).length, 1, "the preflight must run once");
      assert.ok(lines.findIndex(isCompose) > preflight, `preflight must precede compose:\n${lines.join("\n")}`);
      assert.ok(lines.some((line) => line.startsWith(`podman compose -p ${caller.project} `) && line.includes(" up ")));
      assertNoDocker(lines);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  test(`${caller.app} keeps the E2E exit status and tears down the owned project on failure`, () => {
    const f = callerFixture(caller);
    try {
      const result = runCaller(f, { E2E_STATUS: "7" });
      assert.equal(result.status, 7, result.stderr);
      const lines = calls(f);
      assert.ok(lines.includes("npx playwright test"), "the E2E command must have run before the failure");
      assertOwnedTeardown(caller, f, lines);
      assertNoDocker(lines);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  test(`${caller.app} tears down the owned project on success`, () => {
    const f = callerFixture(caller);
    try {
      const result = runCaller(f);
      assert.equal(result.status, 0, result.stderr);
      const lines = calls(f);
      assertOwnedTeardown(caller, f, lines);
      assertNoDocker(lines);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  test(`${caller.app} runs no compose call and no E2E command after a failed preflight`, () => {
    const f = callerFixture(caller);
    try {
      const result = runCaller(f, { PREFLIGHT_STATUS: "125" });
      assert.equal(result.status, 125, result.stderr);
      const lines = calls(f);
      assert.deepEqual(lines.filter(isCompose), [], "a refused preflight must not reach any compose call");
      assert.deepEqual(
        lines.filter((line) => line.startsWith("npx ") || line.startsWith("dotnet ")),
        [],
        "a refused preflight must not start the backend or E2E command",
      );
      assertNoDocker(lines);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  for (const signal of ["SIGTERM", "SIGINT"]) {
    test(`${caller.app} tears down the owned project on ${signal} during the E2E run`, async () => {
      const f = callerFixture(caller);
      try {
        const { code, signal: exitSignal } = await interruptedRun(f, caller, signal);
        assert.ok(code !== 0 || exitSignal !== null, `an interrupted run must not succeed (code ${code})`);
        const lines = calls(f);
        assert.ok(lines.includes("npx playwright test"), "the interrupt must land during the E2E command");
        assertOwnedTeardown(caller, f, lines);
        assertNoDocker(lines);
      } finally {
        rmSync(f.root, { recursive: true, force: true });
      }
    });
  }
}

for (const name of PACKAGE_STACKS) {
  test(`package.json ${name} exports podman-compose and preflights before compose, never docker`, () => {
    const f = makeFixture("stack-", { withHippo: true });
    try {
      const command = PACKAGE_SCRIPTS[name];
      assert.equal(typeof command, "string", `package.json scripts.${name} is missing`);
      const result = spawnSync("/bin/sh", ["-c", command], {
        cwd: f.root,
        encoding: "utf8",
        env: environment(f),
        timeout: 30_000,
      });
      assert.equal(result.status, 0, result.stderr);
      const lines = calls(f);
      const preflight = lines.findIndex(isPreflight);
      assert.equal(lines[preflight], "preflight --compose PCP=podman-compose");
      assert.ok(lines.findIndex(isCompose) > preflight, `preflight must precede compose:\n${lines.join("\n")}`);
      for (const line of lines.filter(isCompose)) assert.match(line, / PCP=podman-compose$/, line);
      assertNoDocker(lines);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });
}
