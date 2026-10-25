// => Example 71: read the pipeline outside in: stages first, data flow second.
type Stage = (lines: string[]) => string[]; // => every stage shares one shape
const dropBlanks: Stage = (lines) => lines.filter((l) => l.trim() !== ""); // => stage one: filter
const number: Stage = (lines) => lines.map((l, i) => `${i + 1}. ${l.trim()}`); // => stage two: map
const stages: Stage[] = [dropBlanks, number]; // => WHY list: the pipeline is data
function run(stages: Stage[], input: string[]): string[] {
  // => fold stages over the input
  return stages.reduce((lines, stage) => stage(lines), input); // => left to right
} // => end of function run(stages: Stage[], input: string[]): stri
const out = run(stages, ["  ada", "", "grace  ", " "]); // => messy input
console.log(out.join(" / ")); // => Output: 1. ada / 2. grace
console.log(stages.length); // => Output: 2, two stages composed
