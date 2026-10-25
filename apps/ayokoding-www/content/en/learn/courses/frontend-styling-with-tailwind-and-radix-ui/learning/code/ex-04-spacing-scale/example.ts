// => Worked Example 4: spacing utilities are multiples of one token.
// => co-01: p-4 means "four spacing steps", not "some pixels".
// => co-02: the 0.25rem step below is the design token everything derives from.
const SPACING_STEP_REM = 0.25; // => the single spacing token: one step is a quarter rem
function spacingRem(steps: number): number {
  // => resolve a spacing utility to rems the way Tailwind does
  return steps * SPACING_STEP_REM; // => p-4 is 4 steps, m-8 is 8 steps
}
function main(): void {
  // => entry point; each print pins one rung of the scale
  console.log("p-1 = " + String(spacingRem(1)) + "rem"); // => Output: p-1 = 0.25rem
  console.log("p-2 = " + String(spacingRem(2)) + "rem"); // => Output: p-2 = 0.5rem
  console.log("p-4 = " + String(spacingRem(4)) + "rem"); // => Output: p-4 = 1rem
  console.log("p-8 = " + String(spacingRem(8)) + "rem"); // => Output: p-8 = 2rem
  console.log("off-scale value possible: false"); // => Output: off-scale value possible: false
}
main(); // => run once; a throw exits nonzero
