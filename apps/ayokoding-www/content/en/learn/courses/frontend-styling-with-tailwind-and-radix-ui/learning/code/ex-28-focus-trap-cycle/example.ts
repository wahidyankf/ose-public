// => Worked Example 28: Tab cycles inside the modal, never past its edges.
// => co-07: the trap wraps focus; the page behind stays unreachable.
function trapTab(focusables: string[], current: number, shift: boolean): number {
  // => resolve one Tab press inside an open modal
  // => forward Tab on the last stop below wraps to first
  if (!shift && current === focusables.length - 1) {
    // => the forward-wrap branch
    return 0; // => Tab on last wraps to first
  } // => forward-wrap branch done
  // => reverse Tab on the first stop below wraps to last
  if (shift && current === 0) {
    // => the reverse-wrap branch
    return focusables.length - 1; // => Shift+Tab on first wraps to last
  } // => reverse-wrap branch done
  if (shift) {
    // => the mid-list reverse branch
    return current - 1; // => anywhere else reverse: step one stop back
  } // => mid-list reverse branch done
  return current + 1; // => anywhere else forward: step one stop ahead
} // => trap complete, two wraps plus ordinary steps
function main(): void {
  // => wrap both edges, step mid-list
  // => entry point; three stops, both edges wrapped
  const stops: string[] = ["close", "name-field", "save"]; // => the modal's three tab stops in order
  console.log("tab on save goes to: " + stops[trapTab(stops, 2, false)]); // => Output: tab on save goes to: close
  console.log("shift+tab on close goes to: " + stops[trapTab(stops, 0, true)]); // => Output: shift+tab on close goes to: save
  console.log("tab on close goes to: " + stops[trapTab(stops, 0, false)]); // => Output: tab on close goes to: name-field
} // => main ends; the trap proven three ways
main(); // => run once; a throw exits nonzero
