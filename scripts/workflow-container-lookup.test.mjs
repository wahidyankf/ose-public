// podman-compose 1.6.0 accepts only `-q` and `-f` on `ps`, so `compose ps -q <service>` exits 2 and
// leaves the lookup empty. Every workflow must find its container by the labels podman-compose sets.
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const WORKFLOWS = resolve(import.meta.dirname, "..", ".github", "workflows");
const REUSABLE_WWW = resolve(WORKFLOWS, "_reusable-www-test-local-deploy.yml");
const SERVICE_AFTER_PS_Q = /\bcompose\s.*\bps\s+-q\s+[^\s-]/;
const LABEL_LOOKUP =
  'podman ps -q --filter "label=io.podman.compose.project=${{ inputs.app-name }}" ' +
  '--filter "label=com.docker.compose.service=${{ inputs.app-name }}"';

test("no workflow looks a service up with compose ps -q <service>", () => {
  const offenders = [];
  for (const name of readdirSync(WORKFLOWS).filter((file) => /\.ya?ml$/.test(file))) {
    readFileSync(resolve(WORKFLOWS, name), "utf8")
      .split("\n")
      .forEach((line, index) => {
        if (SERVICE_AFTER_PS_Q.test(line)) offenders.push(`${name}:${index + 1}: ${line.trim()}`);
      });
  }
  assert.deepEqual(offenders, []);
});

test("the reusable www workflow finds its container by Compose labels at both lookups", () => {
  const lookups = readFileSync(REUSABLE_WWW, "utf8")
    .split("\n")
    .filter((line) => line.includes('container_id="$('));
  assert.equal(lookups.length, 2, `${REUSABLE_WWW}: expected two container lookups`);
  for (const line of lookups) {
    assert.ok(line.includes(LABEL_LOOKUP), `${REUSABLE_WWW} does not look up by labels: ${line.trim()}`);
  }
});
