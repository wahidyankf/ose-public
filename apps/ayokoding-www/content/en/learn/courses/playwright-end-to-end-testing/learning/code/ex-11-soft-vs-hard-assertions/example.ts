// Example 11: Soft Versus Hard Assertions. (co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; expect.soft collects
// => failures and keeps the test running, so one run reports every broken
// => assertion; a hard expect stops at the first failure. Soft is for
// => checklists, hard is for preconditions the rest of the test needs:
// =>   real: await expect.soft(page.getByText("Milk")).toBeVisible();
interface Result {
  // => one collected assertion outcome
  name: string; // => which assertion ran
  pass: boolean; // => whether it held
} // => Result lets soft assertions accumulate instead of throwing

async function main(): Promise<void> {
  // => entry point for the assertion comparison
  const soft: Result[] = []; // => the soft collector; failures land here
  softCheck(soft, "milk visible", true); // => passes, recorded
  softCheck(soft, "bread visible", false); // => fails, recorded, test continues
  softCheck(soft, "eggs visible", true); // => still runs after the failure
  console.log("soft ran all: " + String(soft.length)); // => Output: soft ran all: 3
  console.log("soft failures: " + String(soft.filter((r) => !r.pass).length)); // => Output: soft failures: 1
  let hardStopped = ""; // => which line a hard failure would stop at
  try {
    // => hard assertions throw on the first failure
    hardCheck("milk visible", true); // => passes, execution continues
    hardCheck("bread visible", false); // => throws here
    hardStopped = "third line"; // => never reached
  } catch {
    // => the hard failure lands here
    hardStopped = "second line"; // => execution stopped at the failure
  } // => hard section ends
  console.log("hard stopped at: " + hardStopped); // => Output: hard stopped at: second line
  console.log("soft sees more: " + String(soft.length === 3)); // => Output: soft sees more: true
} // => main ends; soft reported everything, hard reported first

function softCheck(collected: Result[], name: string, pass: boolean): void {
  // => stand-in for expect.soft
  collected.push({ name: name, pass: pass }); // => record, never throw
} // => softCheck keeps the test moving

function hardCheck(name: string, pass: boolean): void {
  // => stand-in for expect
  if (!pass) {
    // => the assertion does not hold
    throw new Error("expect failed: " + name); // => real Playwright fails the test here
  } // => pass branch: return normally
} // => hardCheck stops at the first failure

await main(); // => run once; a failure throws and exits nonzero
