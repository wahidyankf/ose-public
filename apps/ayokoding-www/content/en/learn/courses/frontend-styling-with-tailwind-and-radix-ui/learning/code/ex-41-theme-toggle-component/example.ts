// => Worked Example 41: a theme toggle is controlled state with a side effect.
// => co-11: the parent owns the theme; the toggle announces every change.
// => co-14: the announcement drives the .dark class from Example 40.
function flip(theme: string): string {
  // => flip one theme to the other
  // => light goes dark below, dark goes light
  if (theme === "light") {
    // => the light branch
    return "dark"; // => light becomes dark
  } // => light branch done
  return "light"; // => dark becomes light
} // => flipper complete
function themeToggle(events: string[]): string[] {
  // => replay toggle presses: each press flips the theme and announces it
  // => the controlled state below, seeded light
  let theme: string = "light"; // => the controlled state, seeded light
  const log: string[] = ["theme: " + theme]; // => the log below is the announcement history
  for (const event of events) {
    // => handle one press per pass
    if (event === "toggle") {
      // => the toggle-press branch
      theme = flip(theme); // => flip the controlled state
      log.push("theme: " + theme); // => flip and announce, atomically
    } // => toggle-press branch done
  } // => all presses replayed
  return log; // => one entry per state, in order
} // => toggler complete
function main(): void {
  // => press twice: dark, then back to light
  // => entry point; two presses: dark, then back to light
  const log: string[] = themeToggle(["toggle", "toggle"]); // => press, press
  console.log(log[0]); // => Output: theme: light
  console.log(log[1]); // => Output: theme: dark
  console.log(log[2]); // => Output: theme: light
} // => main ends; atomic flip proven twice
main(); // => run once; a throw exits nonzero
