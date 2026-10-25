import React, { useState } from "react";
// => useState holds the count: interaction tests need stateful subjects.
// => State plus render output is the smallest loop worth driving by click.

export function Counter(): React.JSX.Element {
  // => Named export, no props: the counter owns its state entirely.
  // => Zero props keeps the interaction pure: clicks are the only input.
  const [count, setCount] = useState(0);
  // => Initial zero: the test asserts this starting text before clicking.
  // => State lives in the component: the test drives it only through UI.
  // => useState returns the value plus setter: the standard state pair.
  return (
    // => Single root returned: one tree per component, React reconciles it.
    <div>
      {/* => Wrapper div gives the heading and button one mount root. */}
      {/* => Wrapper carries no semantics: queries look past it to content. */}
      <p>Total clicks: {count}</p>
      {/* => Count rendered as text: the observable effect every click checks. */}
      {/* => Interpolation re-renders on state change: the loop under test. */}
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        {/* => Updater form avoids stale closures when clicks arrive quickly. */}
        {/* => Arrow handler creates no binding bugs: setCount is stable. */}
        {/* => type button prevents form-submit surprises when nested in forms. */}
        Add one
        {/* => Visible text is the accessible name: role query needs nothing else. */}
        {/* => Label and name are one string: rename it, query follows. */}
      </button>
      {/* => Button closes: click target complete, handler wired, named. */}
    </div>
    // => Root closes: paragraph plus button, the whole interactive surface.
  );
  // => Component ends: state, render, and handler, all in twelve lines.
}
