// => Worked Example 41: history remembers the interrupted substate.
// => co-09: in XState this is history: "shallow": return where the dialog interrupted.
type TabLeaf = "profile" | "settings"; // => the two tabs the dialog can interrupt
type TabState = "profile" | "settings" | "dialog"; // => dialog overlays whichever tab was open
interface TabActor {
  // => the actor: current state plus the remembered tab for the dialog return
  state: TabState; // => where the actor is now
  history: TabLeaf; // => where the actor was when the dialog opened
}
// => Dialog open stores history; dialog close restores it.
function tabNext(
  actor: TabActor,
  event: { type: "OPEN_DIALOG" } | { type: "CLOSE" } | { type: "GOTO"; tab: TabLeaf },
): TabActor {
  // => dialog open stores history; dialog close restores it
  if (event.type === "OPEN_DIALOG" && (actor.state === "profile" || actor.state === "settings")) {
    // => opening from a tab: remember it, then show the dialog
    return { state: "dialog", history: actor.state }; // => history stored
  } // => open done
  if (event.type === "CLOSE" && actor.state === "dialog") {
    // => closing the dialog: return to the remembered tab
    return { state: actor.history, history: actor.history }; // => history restored
  } // => close done
  if (event.type === "GOTO" && actor.state !== "dialog") {
    // => manual navigation only outside the dialog: the dialog traps it
    // => tab navigation only outside the dialog: the dialog traps navigation
    return { state: event.tab, history: event.tab }; // => fresh history on manual navigation
  } // => goto done
  return actor; // => no transition: hold everything
}
// => Settings opens a dialog and returns to settings, not to profile.
function main(): void {
  // => entry point; settings opens a dialog and returns to settings, not to profile
  // => navigate to settings, open the dialog, close it: history restores settings
  let actor: TabActor = { state: "profile", history: "profile" }; // => starts on profile
  actor = tabNext(actor, { type: "GOTO", tab: "settings" }); // => manual navigation to settings
  actor = tabNext(actor, { type: "OPEN_DIALOG" }); // => dialog opens over settings
  console.log("dialog over: history=" + actor.history + " state=" + actor.state); // => Output: dialog over: history=settings state=dialog
  actor = tabNext(actor, { type: "CLOSE" }); // => dialog closes: history restored
  console.log("returned: " + actor.state); // => Output: returned: settings
}
main(); // => run once; a throw exits nonzero
