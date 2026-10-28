import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const check = resolve(import.meta.dirname, "container-runtime-check");
const jq = process.env.PATH.split(":")
  .map((directory) => join(directory, "jq"))
  .find(existsSync);

function fixture(body) {
  const dir = mkdtempSync(join(tmpdir(), "runtime-check-"));
  const log = join(dir, "calls");
  symlinkSync(jq, join(dir, "jq"));
  symlinkSync("/bin/bash", join(dir, "bash"));
  function executable(name, source, mode = 0o755) {
    const path = join(dir, name);
    writeFileSync(path, `#!/bin/sh\n${source}\n`);
    chmodSync(path, mode);
    return path;
  }
  const podman = executable(
    "podman",
    `echo "podman $*" >> "$LOG"; [ "$#" -eq 3 ] && [ "$1" = info ] && [ "$2" = --format ] && [ "$3" = json ] || exit 90; printf '%s\\n' "\${INFO}"; exit "\${ENGINE_STATUS:-0}"`,
  );
  const provider = executable(
    "podman-compose",
    `echo "provider $*" >> "$LOG"; [ "$#" -eq 1 ] && [ "$1" = --version ] || exit 90; printf '%s\\n' "\${VERSION}"; exit "\${PROVIDER_STATUS:-0}"`,
  );
  executable("docker-compose", 'echo competitor >> "$LOG"; exit 90');
  try {
    body({ dir, log, podman, provider, executable });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(f, args = [], env = {}) {
  return spawnSync(check, args, {
    encoding: "utf8",
    env: {
      PATH: f.dir,
      LOG: f.log,
      INFO: '{"host":{"security":{"rootless":true}}}',
      VERSION: "podman-compose version 1.6.0",
      PODMAN_COMPOSE_PROVIDER: f.provider,
      ...env,
    },
  });
}

function calls(f) {
  try {
    return readFileSync(f.log, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

test("rootless engine succeeds silently and explicitly selected provider defeats competitor", () =>
  fixture((f) => {
    const result = run(f, ["--compose"], { VERSION: "podman version 6.1.4\npodman-compose version 1.6.0" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
    assert.equal(calls(f), "podman info --format json\nprovider --version\n");
  }));

test("rootful, unreachable and malformed engines stop before provider", () => {
  for (const env of [{ INFO: '{"host":{"security":{"rootless":false}}}' }, { ENGINE_STATUS: "1" }, { INFO: "invalid" }])
    fixture((f) => {
      const result = run(f, ["--compose"], env);
      assert.equal(result.status, 125);
      assert.equal(result.stdout, "");
      assert.equal(calls(f), "podman info --format json\n");
    });
});

test("missing and non-executable engine return shell statuses", () =>
  fixture((f) => {
    rmSync(f.podman);
    assert.equal(run(f).status, 127);
    f.executable("podman", "exit 0", 0o644);
    assert.equal(run(f).status, 126);
  }));

test("lookup skips blocked PATH candidates for engine, jq and provider", () =>
  fixture((f) => {
    const blocked = join(f.dir, "blocked");
    mkdirSync(blocked);
    for (const name of ["podman", "jq", "podman-compose"]) {
      writeFileSync(join(blocked, name), "blocked", { mode: 0o644 });
    }
    const result = run(f, ["--compose"], {
      PATH: `${blocked}:${f.dir}`,
      PODMAN_COMPOSE_PROVIDER: "podman-compose",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(calls(f), "podman info --format json\nprovider --version\n");
  }));

test("interrupted jq preserves its signal status", () =>
  fixture((f) => {
    rmSync(join(f.dir, "jq"));
    f.executable("jq", 'kill -TERM "$$"');
    assert.equal(run(f).status, 143);
    f.executable("jq", "exit 130");
    assert.equal(run(f).status, 130);
  }));

test("fake probes reject workload and incorrect provider arguments", () =>
  fixture((f) => {
    assert.equal(spawnSync(f.podman, ["run", "workload"], { env: { LOG: f.log } }).status, 90);
    assert.equal(spawnSync(f.provider, ["up"], { env: { LOG: f.log } }).status, 90);
    assert.equal(calls(f), "podman run workload\nprovider up\n");
  }));

test("compose requires selected executable and exact provider identity and version", () =>
  fixture((f) => {
    assert.equal(run(f, ["--compose"], { PODMAN_COMPOSE_PROVIDER: "" }).status, 127);
    assert.equal(run(f, ["--compose"], { PODMAN_COMPOSE_PROVIDER: join(f.dir, "missing") }).status, 127);
    chmodSync(f.provider, 0o644);
    assert.equal(run(f, ["--compose"]).status, 126);
    chmodSync(f.provider, 0o755);
    assert.equal(run(f, ["--compose"], { VERSION: "docker-compose version 1.6.0" }).status, 2);
    assert.equal(run(f, ["--compose"], { VERSION: "podman-compose version 1.5.0" }).status, 2);
    assert.equal(run(f, ["--compose"], { PODMAN_COMPOSE_PROVIDER: join(f.dir, "docker-compose") }).status, 2);
  }));

test("invalid arguments are rejected before probes", () =>
  fixture((f) => {
    assert.equal(run(f, ["--compose", "up"]).status, 2);
    assert.equal(run(f, ["unexpected"]).status, 2);
    assert.equal(calls(f), "");
  }));

test("missing jq returns 127 and interrupted probes retain signal status", () =>
  fixture((f) => {
    rmSync(join(f.dir, "jq"));
    assert.equal(run(f).status, 127);
    symlinkSync(jq, join(f.dir, "jq"));
    f.executable("podman", 'kill -TERM "$$"');
    assert.equal(run(f).status, 143);
    f.executable("podman", `printf '%s\\n' "$INFO"`);
    f.executable("podman-compose", 'kill -TERM "$$"');
    assert.equal(run(f, ["--compose"]).status, 143);
  }));
