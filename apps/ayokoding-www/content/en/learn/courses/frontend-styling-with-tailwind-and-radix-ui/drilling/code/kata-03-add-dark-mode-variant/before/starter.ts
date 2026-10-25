// => Kata 3 starter: a card that only knows the light theme.
// => Task: add a dark-mode variant to the existing component (see Example 14).
// => The answer must render both themes with zero new stylesheets.
function cardClasses(theme: string): string {
  // => broken: the theme argument is accepted and then ignored
  void theme; // => BUG: dark renders exactly like light
  return "rounded-lg bg-white p-6"; // => light only, whatever you ask for
}
function main(): void {
  // => entry point; both calls print the same classes: the bug
  console.log("light: " + cardClasses("light")); // => starter prints the light card
  console.log("dark: " + cardClasses("dark")); // => starter prints the light card again
}
main(); // => run once; a throw exits nonzero
