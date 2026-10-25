// => Worked Example 44: a Zod schema guards the tRPC input: two tools, one boundary.
// => co-12: the schema validates, the procedure routes: each tool does its own job.
// => co-01: the same schema object the form used now guards the procedure.
function checkNickname(input: unknown): { ok: true; nickname: string } | { ok: false; issue: string } {
  // => the Zod-shaped gate: z.string().min(2).max(20) at the procedure door
  if (typeof input !== "string" || input.length < 2 || input.length > 20) {
    // => too short, too long, or not a string: the procedure never runs
    return { ok: false, issue: "nickname: 2-20 characters" }; // => gate error out
  } // => valid nickname: fall through
  return { ok: true, nickname: input }; // => trusted nickname out
}
function setNickname(nickname: string): string {
  // => the tRPC-shaped procedure: routing plus the write, no validation inside
  return "nickname set to " + nickname; // => handler trusts the gate
}
function nicknameProcedure(input: unknown): { ok: true; value: string } | { ok: false; issue: string } {
  // => the composed boundary: schema gate first, procedure second
  const checked = checkNickname(input); // => Zod's job: validate
  if (!checked.ok) {
    // => gate failed: the procedure never runs
    return { ok: false, issue: checked.issue }; // => gate error out
  } // => gate passed: fall through to routing
  return { ok: true, value: setNickname(checked.nickname) }; // => tRPC's job: route and run
}
function main(): void {
  // => entry point; a good nickname sets, a short one stops at the schema
  // => a valid nickname passes both tools and the procedure runs
  const good = nicknameProcedure("ada_lovelace"); // => schema-valid input
  if (good.ok) {
    // => narrow before reading the value
    console.log("good: " + good.value); // => Output: good: nickname set to ada_lovelace
  } // => good done
  // => a one-character nickname stops at the schema: the procedure never sees it
  const bad = nicknameProcedure("x"); // => schema-invalid input
  if (!bad.ok) {
    // => the schema's message reaches the caller unchanged
    console.log("bad: " + bad.issue); // => Output: bad: nickname: 2-20 characters
  } // => bad done
}
main(); // => run once; a throw exits nonzero
