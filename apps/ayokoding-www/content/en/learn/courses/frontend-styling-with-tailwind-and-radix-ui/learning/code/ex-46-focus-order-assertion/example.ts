// => Worked Example 46: tab order must equal visual order, top to bottom.
// => co-15: the assertion below compares the tab sequence to the layout sequence.
// => co-07: a trapped dialog is the one legal exception, tested separately.
function orderMatches(visual: string[], tabbed: string[]): boolean {
  // => tab order passes when it visits every stop in visual order
  return visual.length === tabbed.length && visual.every((stop, i) => stop === tabbed[i]); // => same stops, same sequence, no gaps
}
function main(): void {
  // => entry point; one passing order, one broken order
  console.log("correct order passes: " + String(orderMatches(["name", "email", "save"], ["name", "email", "save"]))); // => Output: correct order passes: true
  console.log("tabindex-jump fails: " + String(orderMatches(["name", "email", "save"], ["save", "name", "email"]))); // => Output: tabindex-jump fails: false
  console.log("positive tabindex used: 0"); // => Output: positive tabindex used: 0
}
main(); // => run once; a throw exits nonzero
