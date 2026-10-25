// => Worked Example 29: closing returns focus to the trigger that opened.
// => co-07: the ticket from Example 17 is redeemed on every close path.
function closeDialog(trigger: string, how: string): string[] {
  // => model each close path: all of them restore focus
  return ["closed via " + how, "focus now: " + trigger]; // => the path varies; the restoration does not
}
function main(): void {
  // => entry point; three ways to close, one restoration each
  console.log(closeDialog("settings-button", "escape").join(" | ")); // => Output: closed via escape | focus now: settings-button
  console.log(closeDialog("settings-button", "overlay-click").join(" | ")); // => Output: closed via overlay-click | focus now: settings-button
  console.log(closeDialog("settings-button", "close-button").join(" | ")); // => Output: closed via close-button | focus now: settings-button
}
main(); // => run once; a throw exits nonzero
