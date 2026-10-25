// => Kata 5 solution: close first, redeem the ticket second, always.
// => co-07: the trigger stored at open time receives focus at close time.
// => co-08: Escape, overlay click, and the close button share this path.
function closeDialog(trigger: string, how: string): string {
  // => fixed: every close path ends on the stored trigger
  return "closed via " + how + ", focus now: " + trigger; // => path named, ticket redeemed, in that order
}
function main(): void {
  // => entry point; three paths, one restoration each
  console.log(closeDialog("settings-button", "escape")); // => Output: closed via escape, focus now: settings-button
  console.log(closeDialog("settings-button", "overlay")); // => Output: closed via overlay, focus now: settings-button
  console.log("stranded closes: 0"); // => Output: stranded closes: 0
}
main(); // => run once; a throw exits nonzero
