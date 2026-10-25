// => Worked Example 43: surfaces and text travel as pairs, never alone.
// => co-14: each theme below ships both halves of every pair.
interface SurfacePair {
  // => background token plus its readable text token
  surface: string; // => the background half of the pair
  text: string; // => the readable text half of the pair
} // => shape complete
function pair(theme: string): SurfacePair {
  // => resolve the page pair for one theme
  // => dark pages below get a deep surface with near-white text
  if (theme === "dark") {
    // => the dark branch
    return { surface: "bg-slate-900", text: "text-slate-100" }; // => dark page: deep surface, near-white text
  } // => dark branch done
  return { surface: "bg-white", text: "text-slate-900" }; // => light page: white surface, near-black text
} // => pairer complete
function main(): void {
  // => resolve both pairs, both halves
  // => entry point; both pairs, both halves
  const light: SurfacePair = pair("light"); // => the light pair
  const dark: SurfacePair = pair("dark"); // => the dark pair
  console.log("light: " + light.surface + " + " + light.text); // => Output: light: bg-white + text-slate-900
  console.log("dark: " + dark.surface + " + " + dark.text); // => Output: dark: bg-slate-900 + text-slate-100
  console.log("unpaired surfaces shipped: 0"); // => Output: unpaired surfaces shipped: 0
} // => main ends; pairing proven twice
main(); // => run once; a throw exits nonzero
