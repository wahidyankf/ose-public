// => Kata 3 solution: PUBLISH is guarded on reviewed; drafts are refused.
// => The guard names the refusal so the caller knows the missing step.
type DocState = "draft" | "reviewed" | "published"; // => the document lifecycle
// => The guarded table: every move legal or named-refused.
function next(
  current: DocState,
  event: { type: "REVIEW" } | { type: "PUBLISH" },
): { ok: true; state: DocState } | { ok: false; refused: string } {
  // => the guarded table: every move legal or named-refused
  if (event.type === "REVIEW" && current === "draft") {
    // => review advances drafts
    return { ok: true, state: "reviewed" }; // => legal move
  } // => review done
  if (event.type === "PUBLISH" && current === "reviewed") {
    // => the guard: only reviewed documents publish
    return { ok: true, state: "published" }; // => legal move
  } // => guarded publish done
  if (event.type === "PUBLISH") {
    // => publish from any other state: refused with the missing step
    return { ok: false, refused: "PUBLISH refused in " + current + ": review first" }; // => guard names the fix
  } // => refused publish done
  return { ok: false, refused: "no transition" }; // => every other pair refused
}
// => The draft publish is refused; the legal review-then-publish path still works.
function main(): void {
  // => entry point; the draft publish is refused, the reviewed publish works
  // => publishing a draft is refused with the missing step named
  const draft = next("draft", { type: "PUBLISH" }); // => illegal move
  if (!draft.ok) {
    // => the refusal carries the fix
    console.log("draft publish: " + draft.refused); // => fixed: guard holds
  } // => draft done
  // => the legal path reviews then publishes
  const reviewed = next("draft", { type: "REVIEW" }); // => legal review
  if (reviewed.ok) {
    // => narrow before the publish
    const published = next(reviewed.state, { type: "PUBLISH" }); // => legal publish
    if (published.ok) {
      // => narrow before reading the state
      console.log("reviewed publish: " + published.state); // => legal path unaffected
    } // => published done
  } // => reviewed done
}
main(); // => run once; a throw exits nonzero
