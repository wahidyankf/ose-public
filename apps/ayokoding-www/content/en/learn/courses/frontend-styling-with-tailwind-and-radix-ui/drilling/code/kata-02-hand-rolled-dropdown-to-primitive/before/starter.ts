// => Kata 2 starter: a hand-rolled dropdown with divs and no keyboard map.
// => Task: convert it to a Radix primitive (see Examples 16 and 19).
// => The answer must expose role menu and answer ArrowDown.
interface HandRolled {
  // => div soup: markup without meaning
  element: string; // => nested divs, nothing else
  role: string | null; // => no role: the bug in one field
} // => shape complete, semantics absent
function dropdown(): HandRolled {
  // => build the hand-rolled version
  // => pixels without behaviour, markup without meaning
  return { element: "div>div>div", role: null }; // => BUG: three divs, zero semantics
} // => builder complete, audit pending
function main(): void {
  // => audit the starter once
  // => entry point; the audit shows what is missing
  const menu: HandRolled = dropdown(); // => the starter renders markup only
  console.log("element: " + menu.element); // => starter prints div soup here
  console.log("role: " + String(menu.role)); // => starter prints null: the bug
} // => main ends; the audit proves the gap
main(); // => run once; a throw exits nonzero
