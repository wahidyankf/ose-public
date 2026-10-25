// => Worked Example 37: impossible moves are rejected, not silently allowed.
// => co-08: an explicit table makes every allowed move visible and every other move impossible.
// => co-11: deleting without selecting is unrepresentable: no state exists for it.
type EditorState = "empty" | "selected"; // => text is either selected or it is not
type EditorEvent = { type: "SELECT" } | { type: "DESELECT" } | { type: "DELETE" }; // => the three editor events
function editorNext(
  current: EditorState,
  event: EditorEvent,
): { ok: true; state: EditorState } | { ok: false; rejected: string } {
  // => the transition table: every legal move listed, everything else rejected
  if (event.type === "SELECT") {
    // => selecting always lands in selected
    return { ok: true, state: "selected" }; // => legal from either state
  } // => SELECT done
  if (event.type === "DESELECT") {
    // => deselecting always lands in empty
    return { ok: true, state: "empty" }; // => legal from either state
  } // => DESELECT done
  if (current === "empty") {
    // => DELETE with nothing selected: no state exists for this, so refuse
    return { ok: false, rejected: "DELETE ignored in empty: nothing selected" }; // => impossible move named
  } // => selected: DELETE is legal
  return { ok: true, state: "empty" }; // => deletion consumes the selection
}
function main(): void {
  // => entry point; a legal delete works, an illegal one is named
  // => select then delete: the legal path through the machine
  let state: EditorState = "empty"; // => starts with nothing selected
  const selected = editorNext(state, { type: "SELECT" }); // => SELECT from empty
  if (selected.ok) {
    // => narrow before storing the state
    state = selected.state; // => now selected
  } // => select done
  const deleted = editorNext(state, { type: "DELETE" }); // => DELETE from selected: legal
  if (deleted.ok) {
    // => narrow before storing the state
    state = deleted.state; // => back to empty
  } // => delete done
  console.log("deleted: state=" + state); // => Output: deleted: state=empty
  // => DELETE from empty is refused: the machine names the impossible move
  const refused = editorNext(state, { type: "DELETE" }); // => DELETE from empty: illegal
  if (!refused.ok) {
    // => the rejection names the state and the event
    console.log("refused: " + refused.rejected); // => Output: refused: DELETE ignored in empty: nothing selected
  } // => refused done
}
main(); // => run once; a throw exits nonzero
