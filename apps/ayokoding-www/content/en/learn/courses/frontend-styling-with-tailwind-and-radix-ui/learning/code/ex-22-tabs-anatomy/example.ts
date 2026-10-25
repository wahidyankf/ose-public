// => Worked Example 22: tabs are four parts with one job: one panel at a time.
// => co-06: Root, List, Trigger, and Content divide state from pixels.
const TABS_PARTS: string[] = ["Root", "List", "Trigger", "Content"]; // => state holder, tab row, one tab, one panel
function panelsVisible(active: string, panels: string[]): string[] {
  // => exactly the active panel shows; the rest hide, no exceptions
  return panels.filter((p) => p === active); // => visibility is equality with the active value
}
function main(): void {
  // => entry point; three panels, one visible
  console.log("parts: " + TABS_PARTS.join(",")); // => Output: parts: Root,List,Trigger,Content
  console.log("visible: " + panelsVisible("account", ["account", "password", "team"]).join(",")); // => Output: visible: account
  console.log("visible count: " + String(panelsVisible("team", ["account", "password", "team"]).length)); // => Output: visible count: 1
}
main(); // => run once; a throw exits nonzero
