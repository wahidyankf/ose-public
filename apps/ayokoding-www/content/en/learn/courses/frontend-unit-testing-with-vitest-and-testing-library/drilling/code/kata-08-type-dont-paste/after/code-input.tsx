// => KATA 08 target: identical input, keystroke-driven suite.
// => Production code unchanged: typing exercises what pasting skips.
import React, { useState } from "react";
// => State: the code value plus the transient typing hint.

// => CodeInput: hint while typing (1-2 chars), valid at 3+.
export function CodeInput(): React.JSX.Element {
  // => No props: the event mechanics carry the whole lesson.
  const [value, setValue] = useState("");
  // => Value state: four keystrokes build it one char at a time.
  const [hint, setHint] = useState("");
  // => Hint state: visible mid-typing, gone at completion.
  const changed = (next: string): void => {
    // => Change handler: fires per keystroke under user-event.
    setValue(next);
    // => Value mirrors: the input shows each char as typed.
    setHint(next.length > 0 && next.length < 3 ? "keep typing…" : "");
    // => Hint rule: lengths 1-2 guide, 0 and 3+ stay silent.
  };
  return (
    <div>
      {/* => Wrapper: hint and input render as siblings. */}
      <label htmlFor="kata-code">Code</label>
      {/* => Label: the same query anchor as before. */}
      <input id="kata-code" value={value} onChange={(e) => changed(e.target.value)} />
      {/* => Controlled input: user-event dispatches one event per char. */}
      {hint !== "" && <p>{hint}</p>}
      {/* => Hint paragraph: asserted present mid-typing, absent at the end. */}
    </div>
  );
}
