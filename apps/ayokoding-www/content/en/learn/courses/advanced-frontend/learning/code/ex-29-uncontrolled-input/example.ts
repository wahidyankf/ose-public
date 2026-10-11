// Example 29: An Uncontrolled Input Reads Its Value via a Ref. (co-25)
//
// The counterpart of Example 28: an UNCONTROLLED input owns its own value in the DOM. React does
// not pass it a `value` prop; instead a ref reads the current value out when needed. The DOM, not
// state, is the source of truth.
//
// Note: "An input like `<input />` is uncontrolled"; a controlled input gets a
// `value` (or `checked`) prop. Source: react.dev, `<input>`
// (https://react.dev/reference/react-dom/components/input).

// A ref is a mutable handle to a DOM node; here it holds the element's current value.
interface Ref<T> {
  // => a ref is just a mutable container React keeps stable across renders
  current: T; // => the value the ref points at right now
}

// An uncontrolled input: React sets NO value; the DOM holds it. The ref reads it on demand.
function makeUncontrolledInput(): { ref: Ref<string>; readValue: () => string } {
  // => the DOM is the source of truth; the ref only OBSERVES it
  const domValue = { current: "" }; // => stands in for the input element's live .value
  return {
    ref: domValue, // => a ref attached to the input (like ref={inputRef})
    readValue: () => domValue.current, // => read the DOM's value when you need it (e.g. on submit)
  };
}

const input = makeUncontrolledInput();
// => the user types directly into the DOM; React does not intercept each keystroke
input.ref.current = "Hello, uncontrolled"; // => simulate the user typing into the DOM input
// => React never knew about each keystroke -- it reads the final value only when asked

console.log("value read via ref:", input.readValue()); // => Output: value read via ref: Hello, uncontrolled
