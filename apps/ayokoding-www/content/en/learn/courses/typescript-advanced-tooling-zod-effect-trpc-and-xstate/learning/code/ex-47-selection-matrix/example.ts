// => Worked Example 47: match each gap to its tool, and know what each tool costs.
// => co-15: the selection matrix: validation, errors, API typing, UI flow each name one tool.
// => co-13: the matrix also names what each tool checks at runtime versus type time.
// => co-14: and what adopting it costs an existing codebase.
interface Row {
  // => one matrix row: the gap, its tool, its check, and its adoption cost
  gap: string; // => the problem you actually have
  tool: string; // => the tool that closes it
  check: string; // => runtime, compile-time, or both
  cost: string; // => what adopting it costs
}
function main(): void {
  // => entry point; the four-row matrix every selection decision reduces to
  // => the matrix: four gaps, four tools, four checks, four costs
  const rows: Row[] = [
    // => row one: untrusted data at the boundary
    { gap: "untrusted input", tool: "Zod", check: "runtime", cost: "schemas per boundary" }, // => parse-dont-validate
    // => row two: fallible logic with many failure modes
    { gap: "typed errors", tool: "Effect", check: "compile-time + runtime", cost: "rewrite throws as values" }, // => typed error channel
    // => row three: client and server types drifting apart
    { gap: "API typing", tool: "tRPC", check: "compile-time", cost: "router plus shared types" }, // => end-to-end inference
    // => row four: UI states reachable that should not be
    { gap: "UI flow", tool: "XState", check: "runtime", cost: "model every state" }, // => explicit machines
  ];
  for (const row of rows) {
    // => each row prints as one decision line
    console.log(row.gap + " -> " + row.tool + " [" + row.check + "] cost: " + row.cost); // => gap, tool, check, cost
  } // => matrix printed
  // => the default row: no gap, no tool: plain TypeScript stays plain
  console.log("no gap -> none [compile-time] cost: nothing"); // => Output: no gap -> none [compile-time] cost: nothing
}
main(); // => run once; a throw exits nonzero
