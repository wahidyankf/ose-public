// The organiclever-www image installs npm dependencies from a package.json with every workspace
// dependency stripped, because the registry has no such packages and npm answers 404. Each stripped
// workspace dependency must come back as a copied package, and the non-workspace dependencies of the
// lib that next.config.ts loads at build time must be installed too.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const REPO = resolve(import.meta.dirname, "..");
const APP = "apps/organiclever-www";
const SCOPE = "@open-sharia-enterprise/";
// next.config.ts imports this lib at build time, through src/env-loader.ts and src/environment-bootstrap.ts.
const LIB_LOADED_BY_NEXT_CONFIG = `${SCOPE}ts-env-loader`;

const readRepo = (path) => readFileSync(resolve(REPO, path), "utf8");
const dockerfile = readRepo(`${APP}/Dockerfile`);
const appPackage = JSON.parse(readRepo(`${APP}/package.json`));

// Joins backslash continuations and drops comments, so each entry is one Dockerfile instruction.
const instructions = dockerfile
  .replace(/\\\n/g, " ")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

const copies = instructions
  .filter((line) => line.startsWith("COPY "))
  .map((line) => {
    const args = line
      .slice("COPY ".length)
      .split(/\s+/)
      .filter((token) => !token.startsWith("--"));
    return { sources: args.slice(0, -1), dest: args.at(-1).replace(/\/$/, "") };
  });

const strippedDeps = [...dockerfile.matchAll(/delete pkg\.dependencies\['([^']+)'\]/g)].map((match) => match[1]);
const npmInstalls = instructions.filter((line) => line.startsWith("RUN ") && line.includes("npm install")).join("\n");
const workspaceDeps = Object.keys(appPackage.dependencies).filter((name) => name.startsWith(SCOPE));

test("every workspace dependency of the app is stripped before npm install", () => {
  for (const name of workspaceDeps) {
    assert.ok(strippedDeps.includes(name), `${APP}/Dockerfile does not strip ${name} before npm install`);
  }
});

test("every stripped workspace dependency is copied back in as a resolvable package", () => {
  for (const name of workspaceDeps) {
    const lib = `libs/${name.slice(SCOPE.length)}`;
    const target = `./node_modules/${name}`;
    assert.ok(existsSync(resolve(REPO, lib, "package.json")), `${name} has no workspace lib at ${lib}`);
    assert.ok(
      copies.some((copy) => copy.sources.includes(`${lib}/package.json`) && copy.dest === target),
      `${APP}/Dockerfile does not copy ${lib}/package.json into ${target}/`,
    );
    assert.ok(
      copies.some((copy) => copy.sources.includes(`${lib}/src/`) && copy.dest === `${target}/src`),
      `${APP}/Dockerfile does not copy ${lib}/src/ into ${target}/src/`,
    );
  }
});

test("the lib that next.config.ts loads installs its own non-workspace dependencies", () => {
  const libPackage = JSON.parse(readRepo(`libs/${LIB_LOADED_BY_NEXT_CONFIG.slice(SCOPE.length)}/package.json`));
  for (const [name, version] of Object.entries(libPackage.dependencies ?? {})) {
    assert.ok(
      npmInstalls.includes(`${name}@${version}`),
      `${APP}/Dockerfile does not install ${name}@${version}, which ${LIB_LOADED_BY_NEXT_CONFIG} needs at build time`,
    );
  }
});
