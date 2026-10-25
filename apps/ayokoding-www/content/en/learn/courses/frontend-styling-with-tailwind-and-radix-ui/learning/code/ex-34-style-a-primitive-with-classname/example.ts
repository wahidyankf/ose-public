// => Worked Example 34: className styles the primitive without touching it.
// => co-09: pixels arrive as props; behaviour stays inside the primitive.
interface StyledPrimitive {
  // => behaviour owned inside, pixels passed outside
  behavior: string; // => the untouched behaviour contract
  classes: string; // => the attached pixels
} // => shape complete
function styleDialogContent(className: string): StyledPrimitive {
  // => wrap the primitive: keep its behaviour, add your pixels
  // => behaviour verbatim below, classes attached
  const styled: StyledPrimitive = { behavior: "focus-trap+escape+portal", classes: className }; // => behaviour verbatim, classes attached
  return styled; // => hand the styled primitive to the caller
} // => wrapper complete
function main(): void {
  // => style one dialog content
  // => entry point; the composition keeps both halves intact
  const dialog: StyledPrimitive = styleDialogContent("rounded-lg bg-white p-6 shadow-lg"); // => three tokens of surface, zero behaviour props
  console.log("behavior: " + dialog.behavior); // => Output: behavior: focus-trap+escape+portal
  console.log("classes: " + dialog.classes); // => Output: classes: rounded-lg bg-white p-6 shadow-lg
  console.log("behavior props passed: 0"); // => Output: behavior props passed: 0
} // => main ends; separation proven three ways
main(); // => run once; a throw exits nonzero
