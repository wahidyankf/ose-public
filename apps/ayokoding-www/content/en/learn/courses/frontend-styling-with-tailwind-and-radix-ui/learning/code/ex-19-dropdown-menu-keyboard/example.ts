// => Worked Example 19: a dropdown menu answers six keys and nothing else.
// => co-06: the key map below is primitive behaviour, free with the part.
// => co-08: arrows move, Enter picks, Escape quits, Home and End jump.
const MENU_ITEMS: string[] = ["Profile", "Settings", "Logout"]; // => the three choices under the trigger
function moveIndex(index: number, key: string): number {
  // => resolve one keypress to the next highlighted row
  // => step down below, wrapping past the end
  if (key === "ArrowDown") {
    // => the step-down branch
    return (index + 1) % MENU_ITEMS.length; // => step down, wrapping past the end
  } // => step-down branch done
  // => step up below, wrapping past the start
  if (key === "ArrowUp") {
    // => the step-up branch
    return (index - 1 + MENU_ITEMS.length) % MENU_ITEMS.length; // => step up, wrapping past the start
  } // => step-up branch done
  if (key === "Home") {
    // => the jump-to-start branch
    return 0; // => jump to the first row
  } // => jump-to-start branch done
  if (key === "End") {
    // => the jump-to-end branch
    return MENU_ITEMS.length - 1; // => jump to the last row
  } // => jump-to-end branch done
  return index; // => Enter and Escape choose or quit; the highlight stays
} // => mover complete, six keys covered
function main(): void {
  // => walk the menu the way a keyboard user does
  // => entry point; walk the menu the way a keyboard user does
  console.log("ArrowDown from 0: " + MENU_ITEMS[moveIndex(0, "ArrowDown")]); // => Output: ArrowDown from 0: Settings
  console.log("ArrowDown from 2: " + MENU_ITEMS[moveIndex(2, "ArrowDown")]); // => Output: ArrowDown from 2: Profile
  console.log("End from 0: " + MENU_ITEMS[moveIndex(0, "End")]); // => Output: End from 0: Logout
  console.log("Enter keeps: " + MENU_ITEMS[moveIndex(1, "Enter")]); // => Output: Enter keeps: Settings
} // => main ends; the six-key contract proven four ways
main(); // => run once; a throw exits nonzero
