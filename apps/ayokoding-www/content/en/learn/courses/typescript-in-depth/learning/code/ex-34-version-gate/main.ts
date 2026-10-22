/// <reference path="./node.d.ts" />
// => Example 34: engines states the floor; the gate compares it with the live runtime.
import { readFileSync } from "node:fs"; // => read the manifest fixture
const manifest = JSON.parse(readFileSync("package.json", "utf-8")) as { engines: { node: string } }; // => floor as data
const floor = Number(manifest.engines.node.replace(">=", "")); // => WHY parse: compare numbers, not strings
const live = Number(process.version.replace("v", "").split(".")[0]); // => live major, never printed raw
console.log("needs: >=", floor); // => Output: needs: >= 22
console.log("satisfied:", live >= floor); // => Output: satisfied: true
