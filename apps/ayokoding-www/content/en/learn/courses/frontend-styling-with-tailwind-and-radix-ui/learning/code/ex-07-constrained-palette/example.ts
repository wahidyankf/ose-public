// => Worked Example 7: the palette is a closed list, not a color picker.
// => co-02: only names in the table below are legal colors.
const PALETTE: string[] = ["blue-600", "slate-900", "white", "emerald-500"]; // => every color the team may use
function isTokenColor(name: string): boolean {
  // => admit exactly the palette names, nothing else
  return PALETTE.includes(name); // => membership test: the whole constraint
}
function main(): void {
  // => entry point; two admissions, two rejections
  console.log("blue-600 allowed: " + String(isTokenColor("blue-600"))); // => Output: blue-600 allowed: true
  console.log("emerald-500 allowed: " + String(isTokenColor("emerald-500"))); // => Output: emerald-500 allowed: true
  console.log("#2563eb allowed: " + String(isTokenColor("#2563eb"))); // => Output: #2563eb allowed: false
  console.log("rebeccapurple allowed: " + String(isTokenColor("rebeccapurple"))); // => Output: rebeccapurple allowed: false
}
main(); // => run once; a throw exits nonzero
