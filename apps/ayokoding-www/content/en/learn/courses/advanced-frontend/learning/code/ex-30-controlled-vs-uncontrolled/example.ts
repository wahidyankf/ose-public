// Example 30: An Input Cannot Switch Controlled and Uncontrolled Mid-life. (co-25)
//
// An input that sometimes has a `value` prop and sometimes does not tries to SWITCH modes during
// its lifetime. React forbids this and warns: pick one mode and keep it for the input's whole life.
//
// Note: "An input can't be both controlled and uncontrolled ... [and] cannot switch
// ... over its lifetime." Source: react.dev, `<input>`
// (https://react.dev/reference/react-dom/components/input).

// The warnings React's dev build would emit.
const warnings: string[] = []; // => stands in for the dev-console warning sink
// => a mode switch is a developer bug, caught by the warning rather than a crash

// An input render is either controlled (value present) or uncontrolled (value absent).
function renderInput(value: string | undefined): "controlled" | "uncontrolled" {
  // => the mode is decided by whether `value` is defined on THIS render
  return value === undefined ? "uncontrolled" : "controlled"; // => co-25: the two modes
}

// detectSwitch flags a mode change between two consecutive renders.
function detectSwitch(prev: string, next: string): void {
  // => co-25: switching modes mid-life is the forbidden transition
  if (prev !== next) {
    warnings.push(`Warning: A component is changing ${prev} to ${next}. Inputs should not switch modes.`);
  }
}

// First render: controlled (value = "a"). Second render: uncontrolled (value = undefined).
const mode1 = renderInput("a"); // => controlled
const mode2 = renderInput(undefined); // => uncontrolled -- a forbidden switch
detectSwitch(mode1, mode2); // => the warning fires

console.log("modes:", mode1, "->", mode2); // => Output: modes: controlled -> uncontrolled
console.log("warnings:", warnings); // => Output: the cannot-switch-modes warning
