// => Worked Example 35: a guard conditions a transition on context.
// => co-10: in XState this is guard: ({ context, event }) => ...: the condition beside the move.
interface Counter {
  // => the machine context: data the guards and actions share
  count: number; // => how many times the button was pressed
}
type CounterState = "counting" | "locked"; // => pressing stops mattering once locked
type CounterEvent = { type: "PRESS" } | { type: "RESET" }; // => press advances, reset restores
interface Step {
  // => the actor snapshot: current state plus context, like getSnapshot()
  state: CounterState; // => which state the actor is in
  context: Counter; // => the data carried alongside
}
function step(snapshot: Step, event: CounterEvent): Step {
  // => the guarded transition: PRESS advances only while counting, RESET always restores
  if (event.type === "RESET") {
    // => reset is unguarded: allowed from every state
    return { state: "counting", context: { count: 0 } }; // => back to start, counter cleared
  } // => PRESS from here on
  if (snapshot.state === "locked") {
    // => locked ignores presses: the guard failed, the state holds
    return snapshot; // => no change: the event is swallowed
  } // => counting: the guard passes when the count stays below the limit
  const next: number = snapshot.context.count + 1; // => the press counts
  if (next >= 3) {
    // => the guard trips at three: further presses lock the machine
    return { state: "locked", context: { count: next } }; // => locked with the final count
  } // => below the limit: stay counting
  return { state: "counting", context: { count: next } }; // => counting with the new count
}
function main(): void {
  // => entry point; three presses lock, a fourth is ignored, reset restores
  // => press three times: the third press trips the guard into locked
  let snapshot: Step = { state: "counting", context: { count: 0 } }; // => fresh actor
  snapshot = step(snapshot, { type: "PRESS" }); // => count 1
  snapshot = step(snapshot, { type: "PRESS" }); // => count 2
  snapshot = step(snapshot, { type: "PRESS" }); // => count 3: locks
  console.log("locked: state=" + snapshot.state + " count=" + String(snapshot.context.count)); // => Output: locked: state=locked count=3
  // => a fourth press is swallowed: locked stays locked
  snapshot = step(snapshot, { type: "PRESS" }); // => ignored press
  console.log("ignored: state=" + snapshot.state + " count=" + String(snapshot.context.count)); // => Output: ignored: state=locked count=3
  // => reset restores the machine from any state
  snapshot = step(snapshot, { type: "RESET" }); // => unguarded reset
  console.log("reset: state=" + snapshot.state + " count=" + String(snapshot.context.count)); // => Output: reset: state=counting count=0
}
main(); // => run once; a throw exits nonzero
