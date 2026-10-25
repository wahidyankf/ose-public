// => Worked Example 37: data-state attributes expose primitive state to CSS.
// => co-09: the primitive writes data-state; Tailwind reads it with a variant.
// => co-04: open versus closed is a state variant like hover is.
// => co-13: base and state classes merge without conflict (different groups).
function contentClasses(state: string): string {
  // => build the dialog content classes for one primitive state
  const base: string = "rounded-lg bg-white p-6"; // => always-on surface
  if (state === "open") {
    return base + " data-[state=open]:animate-in";
  } // => open: play the entrance
  return base + " data-[state=closed]:animate-out"; // => closed: play the exit
}
function main(): void {
  // => entry point; the same content in both states
  console.log("open: " + contentClasses("open")); // => Output: open: rounded-lg bg-white p-6 data-[state=open]:animate-in
  console.log("closed: " + contentClasses("closed")); // => Output: closed: rounded-lg bg-white p-6 data-[state=closed]:animate-out
  console.log("hand-written state CSS lines: 0"); // => Output: hand-written state CSS lines: 0
}
main(); // => run once; a throw exits nonzero
