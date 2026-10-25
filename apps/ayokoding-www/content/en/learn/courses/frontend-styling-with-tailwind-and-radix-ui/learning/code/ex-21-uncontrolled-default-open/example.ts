// => Worked Example 21: uncontrolled state means the primitive owns open.
// => co-11: defaultOpen seeds internal state; the parent never votes again.
function uncontrolledDialog(defaultOpen: boolean, userCloses: boolean): string[] {
  // => model the internal state the primitive keeps for you
  // => the seed below decides the first paint
  let open: boolean = defaultOpen; // => the seed decides the first paint
  const log: string[] = ["starts open: " + String(open)]; // => record the seeded state
  if (userCloses) {
    // => the user-dismissal branch
    open = false; // => the user's Escape flips internal state, no parent needed
  } // => user-dismissal branch done
  log.push("ends open: " + String(open)); // => record where it landed
  return log; // => two entries bracketing one user action
} // => model complete, zero parent votes
function main(): void {
  // => seed open, user closes, nobody else involved
  // => entry point; seeded open, user closes, nobody else involved
  const log: string[] = uncontrolledDialog(true, true); // => defaultOpen, then Escape
  console.log(log[0]); // => Output: starts open: true
  console.log(log[1]); // => Output: ends open: false
  console.log("parent votes cast: 0"); // => Output: parent votes cast: 0
} // => main ends; zero wiring proven once
main(); // => run once; a throw exits nonzero
