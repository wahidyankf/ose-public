// Podman with no unqualified-search registries configured rejects a bare Docker Hub name such as `nats:latest`
// ("short-name did not resolve"), and a fresh CI runner has no cached copy to fall back on. Every image that a
// supported compose file or Dockerfile pulls must therefore name its registry. A `FROM` that names an earlier build
// stage pulls nothing and is exempt, and `scratch` is the empty base.
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const SCANNED_ROOTS = ["apps", "infra", "libs", "scripts"];
const SKIPPED_DIRS = new Set([
  ".git",
  ".next",
  "bin",
  "content",
  "coverage",
  "dist",
  "generated-reports",
  "local-tmp",
  "node_modules",
  "obj",
  "worktrees",
]);
const COMPOSE_NAME = /^(?:docker-)?compose(?:\.[\w-]+)*\.ya?ml$/;
const DOCKERFILE_NAME = /^Dockerfile(?:\.[\w-]+)*$/;

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : filesUnder(path);
    return [path];
  });
}

const isComposeFile = (file) => COMPOSE_NAME.test(basename(file));
const isDockerfile = (file) => DOCKERFILE_NAME.test(basename(file));

const containerFiles = SCANNED_ROOTS.flatMap((root) => filesUnder(resolve(ROOT, root)))
  .map((path) => relative(ROOT, path).split(sep).join("/"))
  .filter((file) => isComposeFile(file) || isDockerfile(file))
  .sort();

function composeImages(text) {
  return [...text.matchAll(/^\s*image:[ \t]*["']?([^\s"'#]+)/gm)].map((match) => match[1]);
}

// Returns the base images a Dockerfile pulls: every FROM whose image is neither `scratch` nor an earlier stage.
function pulledBaseImages(text) {
  const stages = new Set(["scratch"]);
  const pulled = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!/^FROM\s/i.test(trimmed)) continue;
    const [image, keyword, stage] = trimmed
      .split(/\s+/)
      .slice(1)
      .filter((token) => !token.startsWith("--"));
    if (!stages.has(image.toLowerCase())) pulled.push(image);
    if (keyword?.toUpperCase() === "AS" && stage) stages.add(stage.toLowerCase());
  }
  return pulled;
}

// A reference names its registry when it has a path and the first segment is a host (a dot, a port, or localhost).
// A bare `node:24-alpine` has no path, so its first segment is the image name, not a host.
function namesRegistry(reference) {
  const [host, ...path] = reference.split("/");
  return path.length > 0 && (host === "localhost" || /[.:]/.test(host));
}

const readRepo = (file) => readFileSync(resolve(ROOT, file), "utf8");

test("the scan reaches the known supported compose files and Dockerfiles", () => {
  for (const expected of [
    "apps/ose-be/docker-compose.e2e.yml",
    "apps/ose-www/Dockerfile",
    "infra/dev/ose-app/Dockerfile.be.dev",
  ]) {
    assert.ok(containerFiles.includes(expected), `${expected} is not scanned`);
  }
});

test("every image a supported compose file declares names its registry", () => {
  const offenders = containerFiles.filter(isComposeFile).flatMap((file) =>
    composeImages(readRepo(file))
      .filter((image) => !namesRegistry(image))
      .map((image) => `${file}: image: ${image}`),
  );
  assert.deepEqual(offenders, []);
});

test("every base image a supported Dockerfile pulls names its registry", () => {
  const offenders = containerFiles.filter(isDockerfile).flatMap((file) =>
    pulledBaseImages(readRepo(file))
      .filter((image) => !namesRegistry(image))
      .map((image) => `${file}: FROM ${image}`),
  );
  assert.deepEqual(offenders, []);
});

test("a FROM naming an earlier stage is exempt, a later stage is not, and a bare Docker Hub name is flagged", () => {
  const staged = "FROM docker.io/library/node:24-alpine AS deps\nFROM deps AS builder\nFROM scratch\n";
  assert.deepEqual(pulledBaseImages(staged), ["docker.io/library/node:24-alpine"]);
  assert.deepEqual(pulledBaseImages("FROM builder\nFROM node:24-alpine AS builder\n"), ["builder", "node:24-alpine"]);
  assert.equal(namesRegistry("node:24-alpine"), false);
  assert.equal(namesRegistry("library/node:24-alpine"), false);
  assert.equal(namesRegistry("localhost:5000/node:24"), true);
});
