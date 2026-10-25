// => Worked Example 13: hover and focus variants react to pointer and keyboard.
// => co-04: each variant below fires on exactly one user state.
interface ElementState {
  // => the two states this button cares about
  hover: boolean; // => pointer presence
  focus: boolean; // => keyboard presence
} // => shape complete
function buttonClasses(state: ElementState): string {
  // => apply the state variants the way the engine does
  // => resting background below is always present
  const classes: string[] = ["bg-blue-600"]; // => resting background, always present
  if (state.hover) {
    // => the hover branch
    classes.push("hover:bg-blue-700"); // => pointer over: deepen one rung
  } // => hover branch done
  if (state.focus) {
    // => the focus branch
    classes.push("focus:ring-2"); // => keyboard here: show the ring
  } // => focus branch done
  return classes.join(" "); // => the class list for this exact state
} // => builder complete
function main(): void {
  // => build three states, three class lists
  // => entry point; three states, three class lists
  console.log("rest: " + buttonClasses({ hover: false, focus: false })); // => Output: rest: bg-blue-600
  console.log("hover: " + buttonClasses({ hover: true, focus: false })); // => Output: hover: bg-blue-600 hover:bg-blue-700
  console.log("focus: " + buttonClasses({ hover: false, focus: true })); // => Output: focus: bg-blue-600 focus:ring-2
} // => main ends; independence proven three times
main(); // => run once; a throw exits nonzero
