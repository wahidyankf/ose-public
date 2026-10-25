// => KATA 01 starting point: works, but blind to users.
// => The test id finds the button while a broken label would too.
import React from "react";
// => Subject: a labelled action button, the role is right there.

// => SaveButton: real text content, real button role, test id anyway.
export function SaveButton({ onSave }: { onSave: () => void }): React.JSX.Element {
  // => Props: one callback, fired on click in both versions.
  return (
    <button type="button" data-testid="save-btn" onClick={onSave}>
      {/* => Test id: the crutch this kata removes. */}
      Save
      {/* => Visible text: what the role query will anchor on. */}
    </button>
  );
}
