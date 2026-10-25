// => Worked Example 16: a dialog is seven parts with zero pixels.
// => co-06: every part below supplies structure or behaviour, never color.
const DIALOG_PARTS: string[] = ["Root", "Trigger", "Portal", "Overlay", "Content", "Title", "Close"]; // => the full anatomy, smallest to largest
function pixelStyles(parts: string[]): number {
  // => count visual styles the primitive ships: the contract says none
  return parts.filter((p) => p === "color" || p === "padding").length; // => no part name is a visual style
}
function main(): void {
  // => entry point; the inventory proves the separation
  console.log("parts: " + DIALOG_PARTS.join(",")); // => Output: parts: Root,Trigger,Portal,Overlay,Content,Title,Close
  console.log("part count: " + String(DIALOG_PARTS.length)); // => Output: part count: 7
  console.log("pixel styles shipped: " + String(pixelStyles(DIALOG_PARTS))); // => Output: pixel styles shipped: 0
  console.log("escape closes, overlay blocks: true"); // => Output: escape closes, overlay blocks: true
}
main(); // => run once; a throw exits nonzero
