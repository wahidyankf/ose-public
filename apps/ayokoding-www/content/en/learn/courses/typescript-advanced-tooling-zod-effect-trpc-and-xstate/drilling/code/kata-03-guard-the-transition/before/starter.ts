// => Kata 3 starter: an unguarded publish that ships drafts.
// => Task: add a guard so PUBLISH works only from reviewed.
type DocState = "draft" | "reviewed" | "published"; // => the document lifecycle
function next(current: DocState, event: { type: "REVIEW" } | { type: "PUBLISH" }): DocState {
  // => the unguarded table: PUBLISH moves from anywhere, including draft
  if (event.type === "REVIEW" && current === "draft") {
    // => review advances drafts
    return "reviewed"; // => legal move
  } // => review done
  if (event.type === "PUBLISH") {
    // => BUG: no guard on the current state: drafts publish too
    return "published"; // => unguarded move
  } // => publish done
  return current; // => no transition: hold
}
function main(): void {
  // => entry point; publishing a draft succeeds when it must not
  // => the draft publishes without review: the missing guard
  console.log("starter: draft publish -> " + next("draft", { type: "PUBLISH" })); // => starter prints published: the bug
  // => the task: guard PUBLISH so drafts stay drafts
  console.log("wanted: draft"); // => target after the fix
}
main(); // => run once; a throw exits nonzero
