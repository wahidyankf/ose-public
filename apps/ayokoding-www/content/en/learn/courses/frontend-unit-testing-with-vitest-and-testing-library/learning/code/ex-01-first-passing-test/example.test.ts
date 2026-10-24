import { expect, test } from "vitest";
// => One import carries the whole runner vocabulary this file needs.
// => Vitest compiles this TypeScript directly, so no build step runs first.
// => Keeping the import list tiny shows a reader exactly what the file uses.

function add(a: number, b: number): number {
  // => The unit under test is an ordinary typed function, nothing special.
  // => Testing starts with plain functions because they have no DOM to set up.
  // => Types on the parameters document the contract the test then checks.
  return a + b;
  // => One obvious line: the test below pins this behavior in place.
}

test("adds two positive numbers", async () => {
  // => test() registers one case; its name reads as a specification sentence.
  // => A good name states the input shape and the expected outcome together.
  // => Later failures quote this name, so it must identify the case alone.
  expect(add(2, 3)).toBe(5);
  // => expect() wraps the real value; toBe() states the exact match rule.
  // => toBe uses Object.is, the strictest equality, right for numbers.
  // => If add ever returns 6, this line names the file and the line number.
});
