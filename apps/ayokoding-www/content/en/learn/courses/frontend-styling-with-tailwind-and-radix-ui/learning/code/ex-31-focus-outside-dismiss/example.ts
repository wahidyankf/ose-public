// => Worked Example 31: outside pointer-down dismisses; inside never does.
// => co-07: dismissal restores focus exactly like Example 29.
// => co-10: the overlay (a portal) is what receives the outside press.
function pointerDown(target: string, trigger: string): string {
  // => resolve one pointer-down while the dialog is open
  // => outside presses below dismiss and restore
  if (target === "overlay") {
    // => the outside branch
    return "closed, focus now: " + trigger; // => outside press: dismiss and restore
  } // => outside branch done
  return "stays open, focus unchanged"; // => inside press: the dialog keeps everything
} // => resolver complete, outside-only dismissal
function main(): void {
  // => press outside, content, and trigger
  // => entry point; outside closes, content and trigger do not
  console.log("overlay press: " + pointerDown("overlay", "settings-button")); // => Output: overlay press: closed, focus now: settings-button
  console.log("content press: " + pointerDown("content", "settings-button")); // => Output: content press: stays open, focus unchanged
  console.log("trigger press: " + pointerDown("trigger", "settings-button")); // => Output: trigger press: stays open, focus unchanged
} // => main ends; outside-only proven three ways
main(); // => run once; a throw exits nonzero
