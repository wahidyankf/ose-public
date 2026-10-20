// Example 25: Grouping With Describe Blocks. (co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; test.describe groups
// => related tests under one name, and hooks or test.use inside the block
// => apply only there; grouping is documentation the runner enforces:
// =>   real: test.describe("checkout", () => { test("guest pays", ...); });
interface Group {
  // => one describe block and its tests
  name: string; // => the group name
  tests: string[]; // => the tests inside it
} // => Group mirrors a describe block

async function main(): Promise<void> {
  // => entry point for the grouping check
  const groups: Group[] = [
    // => the suite structure
    { name: "checkout", tests: ["guest pays", "member pays"] }, // => two checkout tests
    { name: "search", tests: ["finds milk"] }, // => one search test
  ]; // => suite defined
  for (const group of groups) {
    // => the runner walks each group
    console.log(group.name + ": " + String(group.tests.length) + " tests"); // => Output: checkout: 2 tests (next line: search: 1 tests)
  } // => every group reported
  const total: number = groups.reduce((sum, group) => sum + group.tests.length, 0); // => add up every group
  console.log("total: " + String(total)); // => Output: total: 3
  console.log("scoped hooks stay inside: " + String(groups.length === 2 && total === 3)); // => Output: scoped hooks stay inside: true
} // => main ends; the structure is the documentation

await main(); // => run once; a failure throws and exits nonzero
