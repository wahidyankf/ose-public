// Example 21: useEffect Runs After the Browser Paints. (co-18)
//
// An effect does NOT run during render -- it runs at the END of a commit, AFTER the screen has
// painted. So the browser shows the new frame first, then the effect fires. This is why effects
// are the right place to sync with something external (a subscription, the document title) without
// blocking paint.
//
// Note: "Effects run at the end of a commit after the screen updates." Source:
// react.dev, Synchronizing with Effects / useEffect
// (https://react.dev/reference/react/useEffect).

// The ordered log of WHAT happened and WHEN during one render commit.
const trace: string[] = []; // => entries are pushed in execution order
// => the ORDER in this array proves: paint happens BEFORE the effect

// renderComponent models a single commit: render -> paint -> effect (in that order).
function renderComponent(): void {
  // => render phase: produce the new DOM description
  trace.push("render"); // => the component function runs
  // => paint phase: the browser paints the new frame to the screen
  trace.push("paint"); // => co-18: the screen updates BEFORE the effect
  // => commit phase: now (and only now) the effect runs
  trace.push("effect"); // => the useEffect setup fires last
}

renderComponent(); // => one full commit

// The effect appears AFTER paint -- the defining ordering of useEffect.
console.log(trace.join(" -> ")); // => Output: render -> paint -> effect
