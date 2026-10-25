// => Worked Example 45: an Effect pipeline powers the procedure body.
// => co-12: Effect handles failure inside, tRPC handles routing outside: errors become replies.
// => co-04: the procedure composes andThen steps exactly like Theme D's pipelines.
type Outcome = { ok: true; credits: number } | { ok: false; error: string }; // => the Effect-shaped pipeline result
// => The Effect step: deduct the cost or fail with a typed shortfall.
function charge(credits: number, cost: number): Outcome {
  // => the Effect step: deduct or fail with a typed error
  if (credits < cost) {
    // => insufficient credits: the typed failure
    return { ok: false, error: "insufficient credits: have " + String(credits) + ", need " + String(cost) }; // => error value
  } // => affordable: fall through
  return { ok: true, credits: credits - cost }; // => remaining credits
}
// => The procedure runs the Effect and converts its error into a reply.
function purchaseProcedure(
  balance: number,
  cost: number,
): { ok: true; receipt: string } | { ok: false; issue: string } {
  // => the tRPC-shaped procedure: runs the Effect, converts its error into a reply
  const result: Outcome = charge(balance, cost); // => Effect's job: the fallible logic
  if (!result.ok) {
    // => Effect failed: tRPC's job turns the error into a typed reply
    return { ok: false, issue: result.error }; // => error crosses the wire as data
  } // => Effect succeeded: fall through
  return { ok: true, receipt: "paid, balance " + String(result.credits) }; // => success crosses the wire as data
}
// => A funded purchase receipts; an empty wallet replies with the error.
function main(): void {
  // => entry point; a funded purchase receipts, an empty wallet replies with the error
  // => enough credits: the pipeline succeeds and the procedure receipts it
  const funded = purchaseProcedure(100, 30); // => affordable purchase
  if (funded.ok) {
    // => narrow before reading the receipt
    console.log("funded: " + funded.receipt); // => Output: funded: paid, balance 70
  } // => funded done
  // => too few credits: the Effect error becomes the procedure's error reply
  const broke = purchaseProcedure(10, 30); // => unaffordable purchase
  if (!broke.ok) {
    // => the client receives the typed error, not an exception
    console.log("broke: " + broke.issue); // => Output: broke: insufficient credits: have 10, need 30
  } // => broke done
}
main(); // => run once; a throw exits nonzero
