import { expect, test } from "vitest";
// => Same two imports as Example 1: matchers are the whole lesson here.
// => No new runner API appears, so attention stays on equality semantics.

test("toBe checks reference identity for objects", async () => {
  // => toBe is Object.is: same reference passes, equal copy fails.
  const current = { role: "admin" };
  // => One object literal with a single field keeps the point sharp.
  expect(current).toBe(current);
  // => Same reference on both sides: identity holds, trivially true.
  // => This assertion documents that toBe is about identity, not shape.
});

test("toEqual checks structural equality", async () => {
  // => toEqual walks both structures field by field, ignoring identity.
  const actual = { role: "admin", scopes: ["read"] };
  // => A nested array proves the comparison recurses, not just top level.
  expect(actual).toEqual({ role: "admin", scopes: ["read"] });
  // => A fresh literal with the same shape passes: values match, refs differ.
  // => Two literals can never be identical, so toBe would fail this case.
});

test("toStrictEqual also checks types and shape", async () => {
  // => toStrictEqual adds: undefined fields, class, and sparse-array checks.
  expect({ role: "admin", extra: undefined }).toEqual({ role: "admin" });
  // => PASSES: toEqual ignores undefined props, so this pair is equal to it.
  // => Leniency documented: the strict twin below rejects the same pair.
  expect({ role: "admin", extra: undefined }).not.toStrictEqual({
    role: "admin",
  });
  // => toStrictEqual counts the undefined field as a real shape difference.
  // => Strict mode rejects the sloppy object; lenient mode waves it through.
  // => Rule of thumb: default to toStrictEqual for state, toEqual for DTOs.
});
