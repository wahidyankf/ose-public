// => Worked Example 47: every control needs a name assistive tech can read.
// => co-15: the check below is the automated version of a screen-reader pass.
// => co-12: content, aria-label, and aria-labelledby are the three legal sources.
interface Control {
  // => the two places a name can live
  label: string | null; // => the explicit label, when present
  text: string | null; // => the visible text fallback, when present
} // => shape complete
function accessibleName(control: Control): string {
  // => resolve the name the way the accessible-name computation does
  // => an explicit label below always wins
  if (control.label !== null) {
    // => the labelled branch
    return control.label; // => an explicit label always wins
  } // => labelled branch done
  // => visible text below is the fallback name
  if (control.text !== null) {
    // => the text-named branch
    return control.text; // => visible text is the fallback name
  } // => text-named branch done
  throw new Error("unnamed control"); // => neither: the control is invisible to assistive tech
} // => resolver complete, two sources plus one error
function main(): void {
  // => name two controls, fail the third
  // => entry point; labelled, text-named, and one failure
  console.log("labelled: " + accessibleName({ label: "Close", text: "x" })); // => Output: labelled: Close
  console.log("text-named: " + accessibleName({ label: null, text: "Save" })); // => Output: text-named: Save
  try {
    // => the unnamed branch
    accessibleName({ label: null, text: null }); // => neither source present: the icon-only button
  } catch {
    // => unnamed controls land here
    console.log("icon-only throws: true"); // => Output: icon-only throws: true
  } // => unnamed handled, loud as required
} // => main ends; named-or-failing proven three ways
main(); // => run once; an uncaught throw exits nonzero
