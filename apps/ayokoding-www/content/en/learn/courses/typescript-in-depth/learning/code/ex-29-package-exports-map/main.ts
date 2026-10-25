/// <reference path="./node.d.ts" />
// => Example 29: the exports map is the package's public door; deep paths stay shut.
import { readFileSync } from "node:fs"; // => read the manifest fixture
const manifest = JSON.parse(readFileSync("package.json", "utf-8")) as {
  // => manifest as data
  name: string; // => package name field
  exports: Record<string, string>; // => subpath-to-file map
}; // => end of const manifest = JSON.parse(readFileSync("package.js
console.log(manifest.name); // => Output: greeter
console.log(manifest.exports["."] ?? "shut"); // => Output: ./dist/main.js, the open door
console.log(manifest.exports["./internal"] ?? "shut"); // => Output: shut, deep paths closed
