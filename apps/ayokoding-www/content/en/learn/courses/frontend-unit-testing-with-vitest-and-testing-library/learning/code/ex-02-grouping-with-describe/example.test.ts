import { describe, expect, test } from "vitest";
// => describe joins the vocabulary: it groups cases, never asserts alone.
// => Three imports still fit on one line, so the file stays scannable.
// => A reader sees the full runner surface this file touches up front.

function clamp(value: number, min: number, max: number): number {
  // => clamp pins a number into a range: three behaviors worth three cases.
  // => One function with branches deserves a describe, not three loose tests.
  // => The types repeat the contract: numbers in, one number out.
  if (value < min) return min;
  // => Branch one: below the range snaps up to the floor.
  // => Early return keeps branches flat: no nesting, each guard exits fast.
  if (value > max) return max;
  // => Branch two: above the range snaps down to the ceiling.
  // => Guards read top-down in severity order: too low, too high, then fine.
  return value;
  // => Branch three: inside the range passes through untouched.
}

describe("clamp", () => {
  // => The describe name is the unit under test, quoted in every report line.
  // => Nesting describes mirrors the module structure of the source code.
  // => A failing case prints its full path: clamp > snaps values below min.
  test("snaps values below the minimum", async () => {
    // => Each case name finishes the sentence the describe name starts.
    expect(clamp(-5, 0, 10)).toBe(0);
    // => Boundary input: just below min must return min exactly.
  });

  test("snaps values above the maximum", async () => {
    // => The mirror case guards the other boundary the same way.
    expect(clamp(99, 0, 10)).toBe(10);
    // => Symmetric boundaries deserve symmetric cases, never one case.
  });

  test("leaves in-range values alone", async () => {
    // => The pass-through case stops a fix for one branch breaking another.
    expect(clamp(4, 0, 10)).toBe(4);
    // => Interior input proves the function is not just min-or-max.
  });
});
