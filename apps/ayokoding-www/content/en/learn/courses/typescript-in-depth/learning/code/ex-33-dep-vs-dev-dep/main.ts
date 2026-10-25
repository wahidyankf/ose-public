/// <reference path="./node.d.ts" />
// => Example 33: dependencies ship; devDependencies stay on the build machine.
import { readFileSync } from "node:fs"; // => read the manifest fixture
const manifest = JSON.parse(readFileSync("package.json", "utf-8")) as {
  // => manifest as data
  dependencies: Record<string, string>; // => ships to production
  devDependencies: Record<string, string>; // => test and build tools only
}; // => end of const manifest = JSON.parse(readFileSync("package.js
console.log("ships:", Object.keys(manifest.dependencies).join(",")); // => Output: ships: commander
console.log("build-only:", Object.keys(manifest.devDependencies).join(",")); // => Output: build-only: vitest
