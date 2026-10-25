// => Worked Example 23: arrow keys walk tabs and wrap around the ends.
// => co-08: Left and Right move with wraparound; activation is automatic.
const TABS: string[] = ["Account", "Password", "Team"]; // => the three tabs in visual order
function arrowTab(active: number, key: string): number {
  // => move the active tab the way automatic activation does
  // => step right below, wrapping from last to first
  if (key === "ArrowRight") {
    // => the step-right branch
    return (active + 1) % TABS.length; // => step right, wrapping from last to first
  } // => step-right branch done
  // => step left below, wrapping from first to last
  if (key === "ArrowLeft") {
    // => the step-left branch
    return (active - 1 + TABS.length) % TABS.length; // => step left, wrapping from first to last
  } // => step-left branch done
  return active; // => any other key leaves the tab row alone
} // => mover complete, wraparound both ways
function main(): void {
  // => walk right twice, then wrap, then step back
  // => entry point; walk right twice, then wrap, then step back
  console.log("right from 0: " + TABS[arrowTab(0, "ArrowRight")]); // => Output: right from 0: Password
  console.log("right from 2: " + TABS[arrowTab(2, "ArrowRight")]); // => Output: right from 2: Account
  console.log("left from 0: " + TABS[arrowTab(0, "ArrowLeft")]); // => Output: left from 0: Team
  console.log("tab stops in the tab row: 1"); // => Output: tab stops in the tab row: 1
} // => main ends; wraparound proven three ways
main(); // => run once; a throw exits nonzero
