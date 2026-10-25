// => Worked Example 40: the class strategy toggles theme with one class.
// => co-14: .dark on the root flips every dark: variant at once.
// => co-04: dark:bg-slate-900 is a state variant keyed on that ancestor.
function themeRootClasses(dark: boolean): string {
  // => build the root class list for one theme choice
  // => dark on below means every dark: variant fires
  if (dark) {
    // => the dark branch
    return "dark"; // => dark on: every dark: variant fires
  } // => dark branch done
  return ""; // => dark off: every dark: variant sleeps
} // => builder complete, one bit of state
function main(): void {
  // => build both roots once
  // => entry point; the toggle is one class, added or removed
  console.log("light root: '" + themeRootClasses(false) + "'"); // => Output: light root: ''
  console.log("dark root: '" + themeRootClasses(true) + "'"); // => Output: dark root: 'dark'
  console.log("per-component theme props: 0"); // => Output: per-component theme props: 0
} // => main ends; one toggle proven twice
main(); // => run once; a throw exits nonzero
