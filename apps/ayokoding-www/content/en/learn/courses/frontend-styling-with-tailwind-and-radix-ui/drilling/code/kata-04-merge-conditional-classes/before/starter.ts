// => Kata 4 starter: string concat keeps both px-2 and px-4.
// => Task: merge conditional classes so one padding wins (see Example 36).
// => The answer must print exactly one px-* class.
function buttonClasses(active: boolean): string {
  // => broken: both branches concatenate, so conflicts ship together
  // => the base both branches share is built first
  let classes: string = "px-4 py-2"; // => the base both branches share
  if (active) {
    // => the active branch
    classes += " px-2"; // => BUG: px-2 joins px-4 instead of replacing it
  } // => active branch done
  return classes; // => two paddings, one button
} // => builder complete, conflict intact
function main(): void {
  // => render both states once
  // => entry point; the active button carries the conflict
  console.log("idle: " + buttonClasses(false)); // => starter prints one padding here
  console.log("active: " + buttonClasses(true)); // => starter prints px-4 and px-2 together
} // => main ends; the transcript proves the conflict
main(); // => run once; a throw exits nonzero
