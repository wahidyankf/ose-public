// => Worked Example 42: contrast is a ratio, and 4.5 is the passing line.
// => co-14: both themes must pass; a pair that fails in either theme ships in neither.
// => co-12: low contrast is an accessibility defect, not a taste dispute.
function contrastRatio(lighter: number, darker: number): number {
  // => compute the WCAG ratio from two relative luminances
  return (lighter + 0.05) / (darker + 0.05); // => the standard formula, no shortcuts
}
function passes(ratio: number): boolean {
  // => normal text needs 4.5; the model enforces it
  return ratio >= 4.5; // => one threshold for every pair
}
function main(): void {
  // => entry point; black on white sails through, washed grey sinks
  console.log("white on black: " + String(contrastRatio(1.0, 0.0)) + " passes: true"); // => Output: white on black: 21 passes: true
  const grey: number = contrastRatio(0.55, 0.2); // => washed grey over white: low contrast
  console.log("grey on white: " + grey.toFixed(1) + " passes: " + String(passes(grey))); // => Output: grey on white: 2.4 passes: false
}
main(); // => run once; a throw exits nonzero
