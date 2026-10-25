// => Worked Example 3: utilities replace a hand-written button stylesheet.
// => co-01: one class attribute does the work of twelve CSS lines.
// => co-16: the shared stylesheet below is why utility CSS stays small.
function customButtonCssLines(): number {
  // => count the hand-written lines a .btn-primary rule needs
  const lines: string[] = ["padding", "radius", "background", "color", "weight", "border"]; // => six declarations, plus selector and braces
  return lines.length + 2; // => six declarations plus the selector and closing brace
}
function main(): void {
  // => entry point; the numbers make the trade visible
  const utility: string = "px-4 py-2 bg-blue-600 text-white font-semibold rounded"; // => the same button as utilities
  console.log("utility classes: " + utility); // => Output: utility classes: px-4 py-2 bg-blue-600 text-white font-semibold rounded
  console.log("custom css lines: " + String(customButtonCssLines())); // => Output: custom css lines: 8
  console.log("utility lines added to stylesheet: 0"); // => Output: utility lines added to stylesheet: 0
  console.log("second button costs: 0 new rules"); // => Output: second button costs: 0 new rules
}
main(); // => run once; a throw exits nonzero
