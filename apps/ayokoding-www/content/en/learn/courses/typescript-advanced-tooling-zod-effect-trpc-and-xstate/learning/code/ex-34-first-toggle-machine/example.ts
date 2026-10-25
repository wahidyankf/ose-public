// => Worked Example 34: a machine names its states and its allowed moves.
// => co-08: in XState this is createMachine({ initial, states }): states plus guarded transitions.
// => The complete state space in one line: nothing else exists, nothing else is reachable.
type ToggleState = "active" | "inactive"; // => the complete state space: nothing else exists
type ToggleEvent = { type: "TOGGLE" }; // => the only event this machine understands
interface ToggleMachine {
  // => the machine definition: initial state plus the transition table
  // => the table is the machine: every legal move listed, everything else ignored.
  initial: ToggleState; // => where every actor starts
  transitions: Record<ToggleState, Partial<Record<ToggleEvent["type"], ToggleState>>>; // => state plus event to next state
}
// => Two states, one event, two transitions: the smallest complete machine.
function defineToggle(): ToggleMachine {
  // => the machine: two states, one event, two transitions
  return {
    initial: "inactive", // => starts off, like a real toggle
    transitions: {
      inactive: { TOGGLE: "active" }, // => off plus toggle gives on
      active: { TOGGLE: "inactive" }, // => on plus toggle gives off
    },
  };
}
// => Sending is lookup: defined pairs move, undefined pairs hold the state.
function send(machine: ToggleMachine, current: ToggleState, event: ToggleEvent): ToggleState {
  // => the transition function: look the move up, stay put when undefined
  const next: ToggleState | undefined = machine.transitions[current][event.type]; // => table lookup
  if (next === undefined) {
    // => no transition defined: the event is ignored in this state
    return current; // => staying put is explicit, not a crash
  } // => transition found: fall through
  return next; // => the next state
}
function main(): void {
  // => entry point; two toggles return to the start
  // => away from initial and back again: the round trip proves the table.
  // => the actor starts at initial and toggles twice
  const machine: ToggleMachine = defineToggle(); // => machine defined once
  // => The actor starts at initial: every run begins from the same state.
  let state: ToggleState = machine.initial; // => actor starts inactive
  state = send(machine, state, { type: "TOGGLE" }); // => first toggle: inactive to active
  console.log("after one: " + state); // => Output: after one: active
  state = send(machine, state, { type: "TOGGLE" }); // => second toggle: active to inactive
  console.log("after two: " + state); // => Output: after two: inactive
}
main(); // => run once; a throw exits nonzero
