// Example 41: Tagging and Focusing Tests. (co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; title tags (@smoke, @slow)
// => select subsets with --grep: the smoke lane runs per commit, the full
// => suite runs nightly; test.only focuses one test locally and must never
// => be committed:
// =>   real: test("guest pays @smoke", ...) then npx playwright test --grep @smoke
interface Tagged {
  // => one test with its tags
  title: string; // => the test title
  tags: string[]; // => the @tags in the title
} // => Tagged is selectable by grep

async function main(): Promise<void> {
  // => entry point for the tagging check
  const suite: Tagged[] = [
    // => three tests, two tagged smoke
    { title: "guest pays @smoke", tags: ["@smoke"] }, // => per-commit lane
    { title: "member pays @smoke", tags: ["@smoke"] }, // => per-commit lane
    { title: "renders 10k rows @slow", tags: ["@slow"] }, // => nightly lane
  ]; // => suite defined
  const smoke: Tagged[] = suite.filter((test) => test.tags.includes("@smoke")); // => real: --grep @smoke
  console.log("smoke: " + smoke.map((test) => test.title).join("; ")); // => Output: smoke: guest pays @smoke; member pays @smoke
  console.log("smoke count: " + String(smoke.length)); // => Output: smoke count: 2
  console.log("slow excluded: " + String(!smoke.some((test) => test.tags.includes("@slow")))); // => Output: slow excluded: true
  console.log("focus stays local: " + String(suite.every((test) => !test.title.includes(".only")))); // => Output: focus stays local: true
} // => main ends; grep selected the fast lane

await main(); // => run once; a failure throws and exits nonzero
