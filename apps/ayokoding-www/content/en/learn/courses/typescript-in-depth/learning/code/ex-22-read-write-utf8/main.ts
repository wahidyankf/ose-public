/// <reference path="./node.d.ts" />
// => Example 22: explicit utf-8 on both sides makes text I/O portable.
import { writeFileSync, readFileSync, rmSync } from "node:fs"; // => scratch write, read, removal
import { join } from "node:path"; // => portable scratch path
import { tmpdir } from "node:os"; // => writable scratch root
const scratch = join(tmpdir(), "ex22-names.txt"); // => fixed scratch name, never printed
const lines = ["ada\n", "grace hopper\n", "margaret\n"]; // => plain ASCII payload lines
writeFileSync(scratch, lines.join("")); // => three lines written as utf-8
const back = readFileSync(scratch, "utf-8")
  .split("\n")
  .filter((l) => l !== ""); // => lines back, trailer cut
console.log(back.length); // => Output: 3, every line survived
console.log(back[1]); // => Output: grace hopper, content intact
rmSync(scratch, { force: true }); // => scratch removed: no trace left
