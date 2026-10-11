// Example 45: Roving Tabindex Moves Focus with Arrow Keys. (co-24)
//
// Roving tabindex: exactly ONE item in a composite widget (a menu, toolbar, radio group) has
// tabindex="0" (reachable by Tab); the rest have tabindex="-1" (focusable only by script). Arrow
// keys MOVE which item has the "0", so focus walks through the items without leaving the widget.
//
// Note: "the focused element is the active element (`document.activeElement`)";
// strategies are roving tabindex and aria-activedescendant. Source: W3C WAI-ARIA APG --
// Keyboard Interface (https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).

// A menu item: its label and whether it currently holds the roving "0" (is active).
interface MenuItem {
  // => the roving tabindex model: one item is the active entry point at a time
  label: string; // => the visible text
  tabindex: 0 | -1; // => 0 = in the tab sequence; -1 = focusable only via script
}

// The active element id (document.activeElement), tracked as the roving index.
let activeIndex = 0; // => which menu item currently has focus / tabindex 0
const menu: MenuItem[] = [
  // => only ONE item has tabindex 0; arrow keys move which one
  { label: "New", tabindex: 0 },
  { label: "Open", tabindex: -1 },
  { label: "Save", tabindex: -1 },
];

// moveFocus roves the active item by delta (+1 = ArrowRight/Down, -1 = ArrowLeft/Up).
function moveFocus(delta: number): string {
  // => co-24: arrow keys move the "0"; Tab exits the widget, it does not walk it
  menu[activeIndex].tabindex = -1; // => the old active item drops out of the tab sequence
  activeIndex = (activeIndex + delta + menu.length) % menu.length; // => wrap around (modulo)
  menu[activeIndex].tabindex = 0; // => the new active item becomes the entry point
  return menu[activeIndex].label; // => document.activeElement is now this item
}

const moves: string[] = [menu[activeIndex].label]; // => start: "New" is active
moves.push(moveFocus(1)); // => ArrowRight -> "Open"
moves.push(moveFocus(1)); // => ArrowRight -> "Save"
moves.push(moveFocus(1)); // => ArrowRight -> wraps to "New"

console.log("active element after each arrow key:", moves); // => Output: [ 'New', 'Open', 'Save', 'New' ]
console.log("tabindex sequence:", menu.map((m) => m.tabindex).join(",")); // => exactly one "0"
