// => Worked Example 2: a card is a sentence of small utilities.
// => co-01: layout, surface, and spacing each arrive as one class.
function card(...classes: string[]): string {
  // => assemble the card the way JSX would: one className string
  return ["max-w-sm", "rounded-lg", "border", "p-6", "shadow"].concat(classes).join(" "); // => base card plus caller extras
}
function main(): void {
  // => entry point; the transcript names every utility and its job
  const base: string = card(); // => the plain card, no extras
  console.log("card: " + base); // => Output: card: max-w-sm rounded-lg border p-6 shadow
  console.log("parts: layout=max-w-sm surface=rounded-lg,border,shadow spacing=p-6"); // => Output: parts: layout=max-w-sm surface=rounded-lg,border,shadow spacing=p-6
  console.log("extra: " + card("bg-white")); // => Output: extra: max-w-sm rounded-lg border p-6 shadow bg-white
}
main(); // => run once; a throw exits nonzero
