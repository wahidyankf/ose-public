// => Worked Example 14: dark: variants answer to one ancestor class.
// => co-04: dark:bg-slate-900 fires only while .dark sits above the element.
// => co-14: that single toggle is the whole light and dark mechanism.
function surface(theme: string): string {
  // => resolve the page surface for the current theme
  // => light default below: paper white
  let classes: string = "bg-white"; // => light default: paper white
  if (theme === "dark") {
    // => the dark branch
    classes += " dark:bg-slate-900"; // => dark ancestor present: swap the surface
  } // => dark branch done
  return classes; // => both utilities ship; the ancestor picks one
} // => resolver complete
function main(): void {
  // => resolve both themes once
  // => entry point; the toggle is one class on <html>
  console.log("light: " + surface("light")); // => Output: light: bg-white
  console.log("dark: " + surface("dark")); // => Output: dark: bg-white dark:bg-slate-900
  console.log("toggle mechanism: one .dark class"); // => Output: toggle mechanism: one .dark class
} // => main ends; the single toggle proven twice
main(); // => run once; a throw exits nonzero
