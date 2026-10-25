// => Worked Example 5: one schema per variant, picked by a tag.
// => co-01: in Zod this is z.discriminatedUnion("kind", [Circle, Square]).
// => co-02: the tag is checked at the boundary, so handlers never guess.
type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number }; // => the inferred union: z.infer in one line
function area(shape: Shape): number {
  // => exhaustive over the tag: every variant handled, nothing else possible
  if (shape.kind === "circle") {
    // => the tag narrows the union to the circle variant
    return Math.PI * shape.radius * shape.radius; // => radius exists only on this branch
  } // => circle done
  return shape.side * shape.side; // => the only remaining variant is the square
}
function parseShape(input: unknown): { ok: true; shape: Shape } | { ok: false; issue: string } {
  // => boundary parse: tag first, then the matching variant body
  if (typeof input !== "object" || input === null) {
    // => non-objects cannot carry a tag
    return { ok: false, issue: "expected object with kind tag" }; // => reject before reading anything
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (record["kind"] === "circle" && typeof record["radius"] === "number") {
    // => tag matches circle and its body field checks out
    return { ok: true, shape: { kind: "circle", radius: record["radius"] } }; // => trusted circle out
  } // => circle branch done
  if (record["kind"] === "square" && typeof record["side"] === "number") {
    // => tag matches square and its body field checks out
    return { ok: true, shape: { kind: "square", side: record["side"] } }; // => trusted square out
  } // => square branch done
  return { ok: false, issue: "unknown kind: " + String(record["kind"]) }; // => no variant matched the tag
}
function main(): void {
  // => entry point; a good circle, a good square, and a bad tag
  // => a circle payload parses and its area follows from the tag
  const circle = parseShape({ kind: "circle", radius: 2 }); // => valid circle input
  if (circle.ok) {
    // => narrow before computing
    console.log("circle: area=" + circle.shape.kind + ":" + String(Math.round(area(circle.shape) * 100) / 100)); // => Output: circle: area=circle:12.57
  } // => circle done
  // => an unknown tag is rejected at the boundary, never inside area()
  const bad = parseShape({ kind: "triangle", side: 3 }); // => no variant carries this tag
  if (!bad.ok) {
    // => the failure branch names the tag
    console.log("bad tag: " + bad.issue); // => Output: bad tag: unknown kind: triangle
  } // => bad done
}
main(); // => run once; a throw exits nonzero
