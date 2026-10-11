// Example 28: A Controlled Input Owns Its Value in State. (co-25)
//
// A CONTROLLED input gets its `value` from state and writes changes back via `onChange` -- React
// is the single source of truth, and the input never holds a value the state does not also know
// about. (Example 29 shows the uncontrolled opposite; Example 30 shows you cannot switch.)
//
// Note: a controlled input gets a `value` (or `checked`) prop; "An input can't be
// both controlled and uncontrolled ... [and] cannot switch ... over its lifetime." Source:
// react.dev, `<input>` (https://react.dev/reference/react-dom/components/input).

// A minimal controlled input: its value is always whatever `state.value` says.
interface ControlledInput {
  // => value is DERIVED from state; onChange WRITES to state -- one-way both ways
  getValue: () => string; // => value comes FROM state
  onChange: (next: string) => void; // => change goes TO state
}

// makeControlledInput wires value+onChange to a single state cell (React owns the value).
function makeControlledInput(): ControlledInput {
  // => the state cell is the single source of truth for what the input shows
  const state = { value: "" }; // => co-25: state, not the DOM, owns the value
  return {
    getValue: () => state.value, // => the input renders state.value
    onChange: (next: string) => {
      // => every keystroke writes to state, which re-renders the new value
      state.value = next; // => the input can NEVER show a value state does not hold
    },
  };
}

const input = makeControlledInput(); // => one controlled input instance
// => React owns the value: the only way the value changes is through onChange -> state
input.onChange("H"); // => keystroke -> state
input.onChange("He"); // => keystroke -> state
input.onChange("Hel"); // => each render reads state.value back into the input
input.onChange("Hello");

console.log("controlled value:", input.getValue()); // => Output: controlled value: Hello
