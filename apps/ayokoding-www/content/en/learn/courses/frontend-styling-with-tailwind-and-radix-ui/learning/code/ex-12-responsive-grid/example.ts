// => Worked Example 12: one column on phones, three on desktops.
// => co-03: the grid utilities below describe two layouts in one attribute.
function columns(classes: string[], widthPx: number): number {
  // => resolve the column count for a viewport width
  // => stacked on small screens unless the variant fires
  let count: number = 1; // => grid-cols-1: stacked on small screens
  if (classes.includes("md:grid-cols-3") && widthPx >= 768) {
    // => the desktop branch
    count = 3; // => md:grid-cols-3: side by side on desktops
  } // => desktop branch done
  return count; // => the layout the user actually sees
} // => resolver complete
function main(): void {
  // => measure the same markup at two widths
  // => entry point; the same markup measured at two widths
  const grid: string[] = ["grid", "grid-cols-1", "md:grid-cols-3", "gap-4"]; // => one grid, two layouts, even gutters
  console.log("375px columns: " + String(columns(grid, 375))); // => Output: 375px columns: 1
  console.log("1024px columns: " + String(columns(grid, 1024))); // => Output: 1024px columns: 3
  console.log("markup changes between layouts: 0"); // => Output: markup changes between layouts: 0
} // => main ends; stable markup proven twice
main(); // => run once; a throw exits nonzero
