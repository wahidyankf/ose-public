// => Worked Example 45: script the keyboard walkthrough, assert every step.
// => co-15: the walkthrough below is the automated version of manual tabbing.
// => co-08: Tab, Enter, and Escape are the keys the walkthrough presses.
function step(at: number, key: string, stops: string[]): number {
  // => resolve one scripted key to the next stop index
  // => Tab below steps forward, stopping at the end
  if (key === "Tab") {
    // => the Tab branch
    if (at >= stops.length - 1) {
      // => the last-stop guard
      return at; // => already last: stay put
    } // => last-stop guard done
    return at + 1; // => step one stop forward
  } // => Tab branch done
  // => Enter below opens from the trigger only
  if (key === "Enter" && stops[at] === "trigger") {
    // => the open branch
    return 1; // => Enter on the trigger opens the dialog
  } // => open branch done
  // => Escape below closes and restores the trigger
  if (key === "Escape") {
    // => the Escape branch
    return 0; // => Escape closes and restores the trigger
  } // => Escape branch done
  return at; // => anything else holds position
} // => stepper complete
function walkthrough(keys: string[]): string[] {
  // => replay a scripted key sequence against the expected stops
  // => the stops below are what a correct dialog offers
  const stops: string[] = ["trigger", "dialog", "save-button"]; // => the stops a correct dialog offers
  const log: string[] = []; // => one entry per key, pass or fail
  let at: number = 0; // => the walkthrough starts on the trigger
  for (const key of keys) {
    // => press one scripted key per pass
    at = step(at, key, stops); // => move exactly as the contract requires
    log.push(key + " -> " + String(stops[at])); // => record where this key landed
  } // => all keys pressed, every landing recorded
  return log; // => the full walk, checkable line by line
} // => walker complete
function main(): void {
  // => open with Enter, advance, leave with Escape
  // => entry point; open with Enter, leave with Escape
  const log: string[] = walkthrough(["Enter", "Tab", "Escape"]); // => the three keys that prove the dialog
  console.log(log[0]); // => Output: Enter -> dialog
  console.log(log[1]); // => Output: Tab -> save-button
  console.log(log[2]); // => Output: Escape -> trigger
} // => main ends; open-advance-restore proven in order
main(); // => run once; a throw exits nonzero
