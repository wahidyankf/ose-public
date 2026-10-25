// => Worked Example 39: nested states share the parent's transitions.
// => co-09: in XState, editing.text and editing.preview share editing's SAVE and CANCEL.
type EditorLeaf = "text" | "preview"; // => the two nested substates of editing
type EditorState = "idle" | "editing.text" | "editing.preview"; // => dotted names: parent.child
type EditorEvent = { type: "EDIT" } | { type: "PREVIEW" } | { type: "BACK" } | { type: "SAVE" } | { type: "CANCEL" }; // => five editor events
function editorNext(current: EditorState, event: EditorEvent): EditorState {
  // => child transitions first, then the parent's shared transitions
  if (current === "editing.text" && event.type === "PREVIEW") {
    // => child-to-child move: stays inside editing
    return "editing.preview"; // => text to preview
  } // => preview move done
  if (current === "editing.preview" && event.type === "BACK") {
    // => child-to-child move back: stays inside editing
    return "editing.text"; // => preview to text
  } // => back move done
  if ((current === "editing.text" || current === "editing.preview") && event.type === "SAVE") {
    // => parent transition: SAVE works from either child
    return "idle"; // => shared exit to idle
  } // => SAVE done
  if ((current === "editing.text" || current === "editing.preview") && event.type === "CANCEL") {
    // => parent transition: CANCEL works from either child
    return "idle"; // => shared exit to idle
  } // => CANCEL done
  if (current === "idle" && event.type === "EDIT") {
    // => entry into the parent lands in its initial child
    return "editing.text"; // => idle to editing.text
  } // => EDIT done
  return current; // => no transition defined: hold the state
}
function main(): void {
  // => entry point; edit, preview, back, then save through the shared exit
  // => EDIT enters the parent at its initial child
  let state: EditorState = "idle"; // => starts idle
  state = editorNext(state, { type: "EDIT" }); // => idle to editing.text
  console.log("editing: " + state); // => Output: editing: editing.text
  // => child moves stay inside the parent; the parent SAVE exits from either child
  state = editorNext(state, { type: "PREVIEW" }); // => text to preview
  state = editorNext(state, { type: "BACK" }); // => preview to text
  state = editorNext(state, { type: "PREVIEW" }); // => text to preview again
  state = editorNext(state, { type: "SAVE" }); // => parent SAVE from preview
  console.log("saved: " + state); // => Output: saved: idle
}
main(); // => run once; a throw exits nonzero
