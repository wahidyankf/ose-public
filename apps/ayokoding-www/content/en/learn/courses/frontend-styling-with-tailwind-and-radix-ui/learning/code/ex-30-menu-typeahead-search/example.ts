// => Worked Example 30: typing in a menu jumps to the matching item.
// => co-08: typeahead matches the label prefix; the highlight follows the text.
const MENU_ITEMS: string[] = ["Apple", "Banana", "Cheese", "Chili"]; // => the menu in visual order
function typeahead(typed: string): string | null {
  // => find the first item whose label starts with the typed text
  const lower: string = typed.toLowerCase(); // => matching ignores case, as users expect
  const hit: string | undefined = MENU_ITEMS.find((item) => item.toLowerCase().startsWith(lower)); // => first prefix match wins
  return hit === undefined ? null : hit; // => null when nothing matches: highlight stays put
}
function main(): void {
  // => entry point; two hits and one clean miss
  console.log("type ch: " + String(typeahead("ch"))); // => Output: type ch: Cheese
  console.log("type b: " + String(typeahead("b"))); // => Output: type b: Banana
  console.log("type z: " + String(typeahead("z"))); // => Output: type z: null
}
main(); // => run once; a throw exits nonzero
