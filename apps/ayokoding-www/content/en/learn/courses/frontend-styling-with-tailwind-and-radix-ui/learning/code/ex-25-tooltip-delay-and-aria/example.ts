// => Worked Example 25: a tooltip waits, then names its trigger.
// => co-06: Provider sets the delay; Content carries the description.
// => co-12: aria-describedby links the trigger to that description.
const DELAY_MS = 700; // => the default delay: slow enough to skip, fast enough to help
function tooltipName(describedBy: string | null): string {
  // => resolve the accessible name the tooltip lends its trigger
  // => no link below means no name: the failure Example 47 tests for
  if (describedBy === null) {
    // => the unlinked branch
    return "(unnamed)"; // => no link, no name: the failure Example 47 tests for
  } // => unlinked branch done
  return "described by " + describedBy; // => the link that names the trigger
} // => resolver complete
function main(): void {
  // => check the delay, the link, and the miss
  // => entry point; the delay and the link, both checkable
  console.log("delay ms: " + String(DELAY_MS)); // => Output: delay ms: 700
  console.log("named: " + tooltipName("tooltip-save")); // => Output: named: described by tooltip-save
  console.log("unlinked: " + tooltipName(null)); // => Output: unlinked: (unnamed)
} // => main ends; delay and linkage proven three ways
main(); // => run once; a throw exits nonzero
