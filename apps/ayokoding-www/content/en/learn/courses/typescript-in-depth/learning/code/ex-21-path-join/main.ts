/// <reference path="./node.d.ts" />
// => Example 21: node:path joins segments; string concat guesses separators.
import { join, basename, extname, dirname } from "node:path"; // => portable path assembly
const rel = join("courses", "ts", "overview.md"); // => WHY join: separator comes from the platform
console.log(rel); // => Output: courses/ts/overview.md
console.log(basename(rel), extname(rel), dirname(rel)); // => Output: overview.md .md courses/ts
