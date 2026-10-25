// => Worked Example 26: tooltips obey focus and Escape, not just hover.
// => co-08: keyboard users get the same hint pointer users get.
function tooltipVisible(event: string, visible: boolean): boolean {
  // => resolve visibility for one user event
  // => keyboard arrival below shows the hint
  if (event === "focus") {
    // => the focus branch
    return true; // => keyboard arrival shows the hint
  } // => focus branch done
  // => pointer arrival below shows the hint
  if (event === "hover") {
    // => the hover branch
    return true; // => pointer arrival shows the hint
  } // => hover branch done
  // => Escape below always hides it
  if (event === "Escape") {
    // => the Escape branch
    return false; // => Escape always hides it
  } // => Escape branch done
  // => leaving below hides it too
  if (event === "blur") {
    // => the blur branch
    return false; // => leaving hides it too
  } // => blur branch done
  return visible; // => anything else changes nothing
} // => resolver complete, four events covered
function main(): void {
  // => fire the four events that matter
  // => entry point; the four events that matter
  console.log("focus shows: " + String(tooltipVisible("focus", false))); // => Output: focus shows: true
  console.log("escape hides: " + String(tooltipVisible("Escape", true))); // => Output: escape hides: false
  console.log("blur hides: " + String(tooltipVisible("blur", true))); // => Output: blur hides: false
  console.log("hover shows: " + String(tooltipVisible("hover", false))); // => Output: hover shows: true
} // => main ends; symmetry proven four ways
main(); // => run once; a throw exits nonzero
