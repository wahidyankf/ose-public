// => Worked Example 46: the machine decides when the procedure runs.
// => co-12: XState owns the UI state, tRPC owns the server call: events trigger procedures.
// => co-08: only the ready state can submit: the machine gates the network, not the button handler.
type SubmitState = "editing" | "submitting" | "done"; // => the UI states around the call
interface SubmitActor {
  // => the actor: UI state plus the server answer, never both pending and answered
  state: SubmitState; // => where the UI is
  answer: string | null; // => the procedure reply once done
}
function send(actor: SubmitActor, event: { type: "SUBMIT"; call: () => string } | { type: "EDIT" }): SubmitActor {
  // => SUBMIT runs the procedure only from editing; EDIT returns from done
  if (event.type === "SUBMIT" && actor.state === "editing") {
    // => the legal trigger: run the procedure and land in submitting, then done
    const answer: string = event.call(); // => tRPC's job: the server call, exactly once
    return { state: "done", answer: answer }; // => XState's job: the state move with the answer
  } // => submit handled
  if (event.type === "EDIT" && actor.state === "done") {
    // => re-editing clears the answer and returns to editing
    return { state: "editing", answer: null }; // => fresh editing round
  } // => edit handled
  return actor; // => every other pair ignored: double-submit is unrepresentable
}
function main(): void {
  // => entry point; submit once, double-submit ignored, edit reopens
  // => the actor starts editing with no answer
  let actor: SubmitActor = { state: "editing", answer: null }; // => fresh form
  let calls = 0; // => counts procedure invocations: must stay at one
  const call = (): string => {
    // => the procedure stand-in: counts its own invocations
    calls = calls + 1; // => record the call
    return "order_1"; // => the server answer
  };
  actor = send(actor, { type: "SUBMIT", call: call }); // => legal submit: procedure runs
  console.log("submitted: state=" + actor.state + " answer=" + String(actor.answer) + " calls=" + String(calls)); // => Output: submitted: state=done answer=order_1 calls=1
  // => a second SUBMIT from done is ignored: the procedure never runs twice
  actor = send(actor, { type: "SUBMIT", call: call }); // => illegal submit: swallowed
  console.log("double: calls=" + String(calls)); // => Output: double: calls=1
  // => EDIT from done reopens the form for a new round
  actor = send(actor, { type: "EDIT" }); // => legal edit: back to editing
  console.log("editing: state=" + actor.state); // => Output: editing: state=editing
}
main(); // => run once; a throw exits nonzero
