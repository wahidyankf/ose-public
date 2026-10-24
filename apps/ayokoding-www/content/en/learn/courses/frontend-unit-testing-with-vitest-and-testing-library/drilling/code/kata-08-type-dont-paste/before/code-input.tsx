// => KATA 08 starting point: paste the value, skip the keystrokes.
// => Per-keystroke hints never fire: one change event, zero intermediate states.
import React, { useState } from "react";
// => State: the code value plus the transient typing hint.

// => CodeInput: hint while typing (1-2 chars), valid at 3+, error when blurred empty.
export function CodeInput(): React.JSX.Element {
  // => No props: the kata isolates the event mechanics, nothing else.
  const [value, setValue] = useState("");
  // => Value state: every keystroke flows through here in the after-version.
  const [hint, setHint] = useState("");
  // => Hint state: typing guidance, the behavior fireEvent skips.
  const changed = (next: string): void => {
    // => Change handler: runs per keystroke under user-event, once under paste.
    setValue(next);
    // => Value first: the input mirrors what was typed or pasted.
    setHint(next.length > 0 && next.length < 3 ? "keep typing…" : "");
    // => Hint rule: partial input guides, empty and complete show nothing.
  };
  return (
    <div>
      {/* => Wrapper: hint and input render as siblings. */}
      <label htmlFor="kata-code">Code</label>
      {/* => Label: the query anchor, unchanged across the kata. */}
      <input id="kata-code" value={value} onChange={(e) => changed(e.target.value)} />
      {/* => Controlled input: one change event per keystroke -- or one total. */}
      {hint !== "" && <p>{hint}</p>}
      {/* => Hint paragraph: present only mid-typing, the assertion target. */}
    </div>
  );
}
