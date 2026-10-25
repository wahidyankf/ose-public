import React from "react";
// => React is imported so JSX has its classic createElement target.
// => The component file holds no test code: subject and spec stay separate.
// => Separation lets reviewers read behavior without tripping over assertions.

type ButtonProps = { label: string; onPress: () => void };
// => Props are a typed contract: what the test may pass and must handle.
// => onPress returns void: the button reports the press, nothing more.
// => Two props keep the surface minimal: label for users, onPress for logic.

export function PressButton({ label, onPress }: ButtonProps): React.JSX.Element {
  // => A named export keeps the import in the test file explicit and greppable.
  // => The return type documents that this is a rendered element, not data.
  // => Named plus typed: the signature teaches the contract before the body runs.
  return (
    // => JSX describes the DOM the test will query: a real button element.
    // => One root element returned: components render a single tree, always.
    <button type="button" onClick={onPress}>
      {/* => type="button" stops accidental form submits when reused in forms. */}
      {/* => onClick wires the DOM event to the prop: the seam the test presses. */}
      {/* => Wiring by prop, not by global: the button stays reusable anywhere. */}
      {label}
      {/* => The label prop becomes the accessible name screen readers use. */}
      {/* => No aria-label needed: visible text is already the best name. */}
      {/* => Prop-to-name flow: change the prop, the announced name follows. */}
    </button>
    // => A native button carries the button role for free: no ARIA required.
    // => Native elements beat divs-with-roles: semantics come built in.
  );
  // => Closing brace ends the component: everything above renders per props.
}
