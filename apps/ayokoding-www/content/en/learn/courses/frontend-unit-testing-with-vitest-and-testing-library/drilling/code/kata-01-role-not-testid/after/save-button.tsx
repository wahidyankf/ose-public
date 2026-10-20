// => KATA 01 target: the same button, no test id.
// => Nothing changed for users: only the test's coupling changed.
import React from "react";
// => Subject: identical markup minus the testing-only attribute.

// => SaveButton: text content carries the query now.
export function SaveButton({ onSave }: { onSave: () => void }): React.JSX.Element {
  // => Props unchanged: the component API is stable across the kata.
  return (
    <button type="button" onClick={onSave}>
      {/* => No test id: production markup carries zero testing hooks. */}
      Save
      {/* => Visible text: the accessible name the role query reads. */}
    </button>
  );
}
