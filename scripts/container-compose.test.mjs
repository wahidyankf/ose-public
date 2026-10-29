// Fake-command contract for scripts/container-compose, the wrapper that the package.json Compose stacks run inside the
// HIPPO-supervised command. The wrapper is copied beside a fake preflight, as the repository lays them out, and PATH holds
// only a private directory of fakes, so the test resolves no real podman or preflight. Each fake appends its argv and the
// variables it saw to one log. Not covered here: the real preflight (container-runtime-check.test.mjs), a real Compose
// stack, and the package.json wiring (caller-runtime-contract.test.mjs).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const wrapper = resolve(import.meta.dirname, "container-compose");

// Records the fake's name, each argument in brackets (so spaces stay visible), and the variables the wrapper sets.
const record = (name) =>
  `{ printf '%s' ${name}; for argument in "$@"; do printf ' [%s]' "$argument"; done; printf ' PCP=%s BF=%s\\n' "\${PODMAN_COMPOSE_PROVIDER-unset}" "\${BUILDAH_FORMAT-unset}"; } >>"$LOG"`;

const PREFLIGHT = `${record("preflight")}
exit "\${PREFLIGHT_STATUS:-0}"`;

const PODMAN = `${record("podman")}
exit "\${PODMAN_STATUS:-0}"`;

function executable(path, body) {
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
}

function fixture(body) {
  const dir = mkdtempSync(join(tmpdir(), "container-compose-"));
  try {
    const scripts = join(dir, "scripts");
    const bin = join(dir, "bin");
    mkdirSync(scripts);
    mkdirSync(bin);
    copyFileSync(wrapper, join(scripts, "container-compose"));
    chmodSync(join(scripts, "container-compose"), 0o755);
    executable(join(scripts, "container-runtime-check"), PREFLIGHT);
    executable(join(bin, "podman"), PODMAN);
    body({ dir, scripts, bin, log: join(dir, "calls") });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(f, args, env = {}) {
  return spawnSync(join(f.scripts, "container-compose"), args, {
    encoding: "utf8",
    cwd: f.dir,
    env: { PATH: f.bin, HOME: f.dir, LOG: f.log, ...env },
    timeout: 30_000,
  });
}

function calls(f) {
  return existsSync(f.log) ? readFileSync(f.log, "utf8").split("\n").filter(Boolean) : [];
}

const UP_ARGS = [
  "--env-file",
  "infra/dev/organiclever-app/.env",
  "-f",
  "infra/dev/organiclever-app/docker-compose.yml",
  "up",
  "--build",
];
const DOWN_ARGS = [
  "--env-file",
  "infra/dev/organiclever-app/.env",
  "-f",
  "infra/dev/organiclever-app/docker-compose.yml",
  "down",
  "-v",
];

test("the wrapper is a committed executable POSIX shell script", () => {
  assert.notEqual(statSync(wrapper).mode & 0o111, 0, "the wrapper must be executable");
  assert.equal(readFileSync(wrapper, "utf8").split("\n")[0], "#!/bin/sh");
});

test("up --build exports the provider and BUILDAH_FORMAT=docker, preflights, then execs podman compose", () =>
  fixture((f) => {
    const result = run(f, UP_ARGS, { PODMAN_COMPOSE_PROVIDER: "docker-compose", BUILDAH_FORMAT: "buildah" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.deepEqual(calls(f), [
      "preflight [--compose] PCP=podman-compose BF=docker",
      "podman [compose] [--env-file] [infra/dev/organiclever-app/.env] [-f] [infra/dev/organiclever-app/docker-compose.yml] [up] [--build] PCP=podman-compose BF=docker",
    ]);
  }));

test("down -v exports the provider and leaves the ambient build format untouched", () =>
  fixture((f) => {
    const result = run(f, DOWN_ARGS, { PODMAN_COMPOSE_PROVIDER: "docker-compose", BUILDAH_FORMAT: "buildah" });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(calls(f), [
      "preflight [--compose] PCP=podman-compose BF=buildah",
      "podman [compose] [--env-file] [infra/dev/organiclever-app/.env] [-f] [infra/dev/organiclever-app/docker-compose.yml] [down] [-v] PCP=podman-compose BF=buildah",
    ]);
  }));

test("down -v without an ambient build format passes none to podman compose", () =>
  fixture((f) => {
    const result = run(f, DOWN_ARGS);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(calls(f), [
      "preflight [--compose] PCP=podman-compose BF=unset",
      "podman [compose] [--env-file] [infra/dev/organiclever-app/.env] [-f] [infra/dev/organiclever-app/docker-compose.yml] [down] [-v] PCP=podman-compose BF=unset",
    ]);
  }));

test("up --build overrides an ambient build format with docker", () =>
  fixture((f) => {
    const result = run(f, UP_ARGS, { BUILDAH_FORMAT: "buildah" });
    assert.equal(result.status, 0, result.stderr);
    for (const line of calls(f)) assert.match(line, / BF=docker$/, line);
    assert.equal(calls(f).length, 2);
  }));

test("arguments reach podman compose one for one, including one containing spaces", () =>
  fixture((f) => {
    const args = ["-f", "infra/dev/my stack/docker-compose.yml", "down", "-v"];
    const result = run(f, args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      calls(f)[1],
      /^podman \[compose\] \[-f\] \[infra\/dev\/my stack\/docker-compose\.yml\] \[down\] \[-v\] /,
    );
  }));

for (const status of ["2", "125", "126", "127"]) {
  test(`a preflight refusal with status ${status} ends the wrapper with that status before any compose call`, () =>
    fixture((f) => {
      const result = run(f, UP_ARGS, { PREFLIGHT_STATUS: status });
      assert.equal(result.status, Number(status), result.stderr);
      assert.deepEqual(
        calls(f).filter((line) => line.startsWith("podman ")),
        [],
        "a refused preflight must not reach podman compose",
      );
      assert.equal(calls(f).length, 1, "only the preflight may run");
    }));
}

test("a compose failure keeps its own exit status after the preflight passes", () =>
  fixture((f) => {
    const result = run(f, DOWN_ARGS, { PODMAN_STATUS: "7" });
    assert.equal(result.status, 7, result.stderr);
    assert.equal(calls(f).length, 2);
    assert.match(calls(f)[1], /^podman \[compose\]/);
  }));

test("a missing preflight fails closed with 127 and runs no compose call", () =>
  fixture((f) => {
    rmSync(join(f.scripts, "container-runtime-check"));
    const result = run(f, UP_ARGS);
    assert.equal(result.status, 127, result.stderr);
    assert.deepEqual(calls(f), []);
  }));
