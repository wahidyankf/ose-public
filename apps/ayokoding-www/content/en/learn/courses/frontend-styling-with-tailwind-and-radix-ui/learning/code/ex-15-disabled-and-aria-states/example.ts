// => Worked Example 15: disabled and aria-expanded are states, not styles.
// => co-04: disabled: and aria-expanded: variants fire on attribute truth.
// => co-12: the aria attribute below is behaviour the styling must not remove.
interface ToggleState {
  // => the two facts this button exposes
  disabled: boolean; // => usability fact
  expanded: boolean; // => openness fact
} // => shape complete
function toggleClasses(state: ToggleState): string {
  // => build the class list from the element's real state
  // => shape utilities below, always on
  const classes: string[] = ["px-4", "py-2"]; // => shape utilities, always on
  if (state.disabled) {
    // => the disabled branch
    classes.push("disabled:opacity-50"); // => disabled: dims the button for every user
  } // => disabled branch done
  if (state.expanded) {
    // => the expanded branch
    classes.push("aria-expanded:rotate-180"); // => open menu: turn the chevron with it
  } // => expanded branch done
  return classes.join(" "); // => styling follows state; state lives in attributes
} // => builder complete
function main(): void {
  // => build three states, three class lists
  // => entry point; state in, honest classes out
  console.log("ready: " + toggleClasses({ disabled: false, expanded: false })); // => Output: ready: px-4 py-2
  console.log("disabled: " + toggleClasses({ disabled: true, expanded: false })); // => Output: disabled: px-4 py-2 disabled:opacity-50
  console.log("open: " + toggleClasses({ disabled: false, expanded: true })); // => Output: open: px-4 py-2 aria-expanded:rotate-180
} // => main ends; state honesty proven three times
main(); // => run once; a throw exits nonzero
