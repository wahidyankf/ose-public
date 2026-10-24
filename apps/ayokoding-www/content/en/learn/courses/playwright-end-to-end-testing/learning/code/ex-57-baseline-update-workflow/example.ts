// Example 57: Baseline Update Workflow. (co-07: visual-comparison)
// => Playwright 1.60.0, docs accessed 2026-10-20; when the UI genuinely
// => changes, a human reviews the diff and runs with --update-snapshots to
// => bless the new baseline; the update is a deliberate, reviewed commit,
// => never an automatic overwrite on red:
// =>   real: npx playwright test --update-snapshots (after reviewing the diff)
async function main(): Promise<void> {
  // => entry point for the update check
  let baseline = "receipt|milk,$3.00"; // => the committed baseline
  const render: string = "receipt|milk,$2.40"; // => the new sale price renders
  const mismatch: boolean = render !== baseline; // => the gate goes red
  console.log("mismatch: " + String(mismatch)); // => Output: mismatch: true
  const reviewed = true; // => a human looked at the diff and approved the price
  if (mismatch && reviewed) {
    // => update only after review
    baseline = render; // => real: --update-snapshots writes the new bytes
  } // => update branch ends
  console.log("baseline now: " + baseline); // => Output: baseline now: receipt|milk,$2.40
  console.log("red means review: " + String(mismatch && reviewed)); // => Output: red means review: true
  console.log("gate green again: " + String(render === baseline)); // => Output: gate green again: true
} // => main ends; the red build became a reviewed update

await main(); // => run once; a failure throws and exits nonzero
