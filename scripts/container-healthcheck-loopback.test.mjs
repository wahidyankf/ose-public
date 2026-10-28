// Podman resolves `localhost` to ::1 first, but the Next.js servers listen on IPv4 only and BusyBox wget does not
// fall back to 127.0.0.1, so an in-container healthcheck that names `localhost` stays unhealthy under Podman.
// Every probe must name the IPv4 loopback address.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const CONTAINER_FILES = [
  "infra/dev/ose-www/docker-compose.yml",
  "infra/dev/organiclever-www/docker-compose.yml",
  "infra/dev/ayokoding-www/docker-compose.yml",
  "apps/ose-www/Dockerfile",
  "apps/organiclever-www/Dockerfile",
  "apps/ayokoding-www/Dockerfile",
];
const URL_PATTERN = /https?:\/\/[^\s"']+/g;

function probeUrlsIn(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), "utf8")
    .split("\n")
    .filter((line) => line.includes("wget"))
    .flatMap((line) => line.match(URL_PATTERN) ?? []);
}

test("no healthcheck probe in the six container files names localhost", () => {
  const offenders = CONTAINER_FILES.flatMap((file) =>
    probeUrlsIn(file)
      .filter((url) => url.includes("localhost"))
      .map((url) => `${file}: ${url}`),
  );
  assert.deepEqual(offenders, []);
});

test("each container file probes the IPv4 loopback 127.0.0.1", () => {
  const offenders = CONTAINER_FILES.flatMap((file) => {
    const probes = probeUrlsIn(file);
    if (probes.length === 0) return [`${file}: no healthcheck probe found`];
    return probes.filter((url) => !url.startsWith("http://127.0.0.1:")).map((url) => `${file}: ${url}`);
  });
  assert.deepEqual(offenders, []);
});

test("the ose-www compose probe hits a tRPC procedure the app defines", () => {
  const probes = probeUrlsIn("infra/dev/ose-www/docker-compose.yml");
  assert.equal(probes.length, 1);
  assert.equal(new URL(probes[0]).pathname, "/api/trpc/health.check");

  const appRouter = readFileSync(resolve(ROOT, "apps/ose-www/src/features/app-shell/shell/root-router.ts"), "utf8");
  assert.match(appRouter, /^\s*health: healthRouter,$/m, "appRouter must mount healthRouter under the key `health`");

  const healthRouter = readFileSync(resolve(ROOT, "apps/ose-www/src/features/health/shell/router.ts"), "utf8");
  assert.match(healthRouter, /^\s*check: publicProcedure\b/m, "healthRouter must define the `check` procedure");
});
