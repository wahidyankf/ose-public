/// <reference path="./node.d.ts" />
// => Example 30: strict plus outDir in tsconfig; every build repeats the same policy.
import { readFileSync } from "node:fs"; // => read the tsconfig fixture itself
const config = JSON.parse(readFileSync("tsconfig.json", "utf-8")) as {
  // => config as data
  compilerOptions: { strict: boolean; outDir: string }; // => the two policy fields
}; // => end of const config = JSON.parse(readFileSync("tsconfig.jso
console.log("strict:", config.compilerOptions.strict); // => Output: strict: true
console.log("outDir:", config.compilerOptions.outDir); // => Output: outDir: out
