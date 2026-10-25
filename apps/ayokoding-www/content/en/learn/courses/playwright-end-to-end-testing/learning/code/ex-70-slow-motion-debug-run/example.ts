// Example 70: Slow-Motion Debug Run. (co-15: flakiness-diagnosis, co-06: trace-viewer)
// => Playwright 1.60.0, docs accessed 2026-10-20; --headed --slow-mo pauses
// => between actions so a human watches the failure happen; slow motion is
// => a debugging aid for one red test, never a suite setting -- it multiplies
// => every run's time for no coverage gain:
// =>   real: npx playwright test --headed --slow-mo=500 (one file, while watching)
async function main(): Promise<void> {
  // => entry point for the slow-motion check
  const steps: string[] = ["goto /cart", "click Pay", "assert total"]; // => the failing test's steps
  const watched: string[] = slowRun(steps, 500); // => 500ms pauses, modeled as markers
  console.log("steps: " + String(watched.length)); // => Output: steps: 3
  console.log("pauses marked: " + String(watched.every((step) => step.includes("+500ms")))); // => Output: pauses marked: true
  console.log("first: " + String(watched[0])); // => Output: first: goto /cart +500ms
  console.log("debug aid, not setting: " + String(watched.length === steps.length)); // => Output: debug aid, not setting: true
} // => main ends; every step played slowly once

function slowRun(steps: string[], pause: number): string[] {
  // => stand-in for --slow-mo
  return steps.map((step) => step + " +" + String(pause) + "ms"); // => each action waits before the next
} // => slowRun marks the pauses without sleeping

await main(); // => run once; a failure throws and exits nonzero
