// => Worked Example 11: mobile-first means base styles apply everywhere.
// => co-03: md:text-lg adds a rule above 768px and changes nothing below it.
const MD_BREAKPOINT = 768; // => the md threshold in pixels: one design decision
function textSize(classes: string[], widthPx: number): string {
  // => resolve the size the way the cascade does
  // => base applies at every width, including phones
  let size: string = "text-sm"; // => base applies at every width, including phones
  if (classes.includes("md:text-lg") && widthPx >= MD_BREAKPOINT) {
    // => the variant branch
    size = "text-lg"; // => the variant wins only above the breakpoint
  } // => variant branch done
  return size; // => exactly one size survives per width
} // => resolver complete
function main(): void {
  // => measure one phone width, one desktop width
  // => entry point; one phone width, one desktop width
  const classes: string[] = ["text-sm", "md:text-lg"]; // => the responsive heading
  console.log("375px: " + textSize(classes, 375)); // => Output: 375px: text-sm
  console.log("1024px: " + textSize(classes, 1024)); // => Output: 1024px: text-lg
  console.log("base covers small screens: true"); // => Output: base covers small screens: true
} // => main ends; mobile-first proven twice
main(); // => run once; a throw exits nonzero
