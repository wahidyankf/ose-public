/// <reference path="./node.d.ts" />
// => Example 31: the lockfile pins exact versions; ranges resolve once, installs repeat.
import { readFileSync } from "node:fs"; // => read the lockfile fixture
const lock = JSON.parse(readFileSync("package-lock.json", "utf-8")) as {
  // => lockfile as data
  lockfileVersion: number; // => lock format version
  packages: { "": { dependencies: Record<string, string> } }; // => root pinned set
}; // => end of const lock = JSON.parse(readFileSync("package-lock.j
console.log("lockfileVersion:", lock.lockfileVersion); // => Output: lockfileVersion: 3
console.log("vitest:", lock.packages[""].dependencies["vitest"]); // => Output: vitest: 5.2.8, exact pin
