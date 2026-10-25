// => Worked Example 38: entrances and exits are state utilities, not keyframes.
// => co-04: data-state variants pick the animation the way hover picks color.
// => co-09: the primitive owns open-or-closed; Tailwind owns how it looks.
function animationFor(state: string, side: string): string {
  // => choose the entrance animation for one open state and side
  // => closing below takes the shared exit
  if (state !== "open") {
    // => the closing branch
    return "data-[state=closed]:animate-out"; // => closing: the shared exit
  } // => closing branch done
  // => top menus below slide down into place
  if (side === "top") {
    // => the top-placement branch
    return "data-[state=open]:slide-in-from-top"; // => top menu: slide down into place
  } // => top-placement branch done
  return "data-[state=open]:fade-in"; // => anywhere else: fade in
} // => chooser complete, zero keyframes authored
function main(): void {
  // => animate three placements
  // => entry point; three placements, three animations, zero keyframes
  console.log("top: " + animationFor("open", "top")); // => Output: top: data-[state=open]:slide-in-from-top
  console.log("center: " + animationFor("open", "center")); // => Output: center: data-[state=open]:fade-in
  console.log("closing: " + animationFor("closed", "top")); // => Output: closing: data-[state=closed]:animate-out
} // => main ends; state-driven motion proven three ways
main(); // => run once; a throw exits nonzero
