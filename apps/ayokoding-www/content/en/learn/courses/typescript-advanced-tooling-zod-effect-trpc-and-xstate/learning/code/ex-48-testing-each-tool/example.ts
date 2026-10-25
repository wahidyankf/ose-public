// => Worked Example 48: test each tool at its own seam.
// => co-16: schemas get hostile inputs, effects get failing layers, procedures get callers, machines get event scripts.
// => co-15: the seam decides the tool, and the tool decides the seam: selection and testing agree.
function testSchema(check: (input: unknown) => boolean, hostile: unknown[]): string {
  // => the Zod seam: hostile inputs in, rejection count out
  let rejected = 0; // => rejections counted
  for (const input of hostile) {
    // => every hostile input must fail
    if (!check(input)) {
      // => rejected as required
      rejected = rejected + 1; // => count it
    } // => input handled
  } // => all hostile inputs tried
  return "schema: " + String(rejected) + "/" + String(hostile.length) + " rejected"; // => full rejection required
}
function testMachine(events: string[], legal: Record<string, string[]>): string {
  // => the XState seam: an event script in, the visited states out
  let state = "idle"; // => actors start at initial
  const visited: string[] = [state]; // => trace starts at initial
  for (const event of events) {
    // => each scripted event must transition
    const next: string | undefined = (legal[state] as unknown as Record<string, string> | undefined)?.[event]; // => table lookup
    if (next === undefined) {
      // => illegal script step: the test fails loudly
      return "machine: illegal " + event + " in " + state; // => script bug, not machine bug
    } // => legal: advance
    state = next; // => new current state
    visited.push(state); // => trace grows
  } // => script consumed
  return "machine: " + visited.join(">"); // => the full trace as proof
}
function main(): void {
  // => entry point; one hostile-input suite and one event-script suite, both green
  // => the schema suite: three hostile inputs, three rejections required
  const isName = (input: unknown): boolean => typeof input === "string" && input.length > 0; // => the schema stand-in
  console.log(testSchema(isName, ["", 42, null])); // => Output: schema: 3/3 rejected
  // => the machine suite: two legal events walk idle to done
  console.log(testMachine(["START", "FINISH"], { idle: { START: "working" }, working: { FINISH: "done" }, done: {} })); // => Output: machine: idle>working>done
  // => an illegal script step fails the suite with the exact state and event
  console.log(testMachine(["FINISH"], { idle: { START: "working" }, working: { FINISH: "done" }, done: {} })); // => Output: machine: illegal FINISH in idle
}
main(); // => run once; a throw exits nonzero
