// => Kata 5 solution: the schema gate parses, the effect runs on trusted numbers only.
// => Parse-dont-validate meets the typed error channel: boundary first, logic second.
function checkPct(input: unknown): { ok: true; pct: number } | { ok: false; issue: string } {
  // => the schema gate: real numbers in range, everything else rejected
  if (typeof input !== "number" || !Number.isFinite(input) || input < 0 || input > 100) {
    // => strings, NaN, and out-of-range numbers never reach the effect
    return { ok: false, issue: "pct: expected number 0-100" }; // => gate error with the range
  } // => trusted number: fall through
  return { ok: true, pct: input }; // => trusted pct out
}
function discountEffect(pct: number): { ok: true; rate: number } | { ok: false; error: string } {
  // => the effect, unchanged: runs only on schema-trusted input now
  if (pct > 50) {
    // => business rule: never discount more than half
    return { ok: false, error: "discount capped at 50" }; // => typed error value
  } // => within cap: fall through
  return { ok: true, rate: 1 - pct / 100 }; // => the multiplier
}
function applyDiscount(input: unknown): { ok: true; rate: number } | { ok: false; issue: string } {
  // => the composed boundary: schema gate first, effect second
  const checked = checkPct(input); // => Zod's job: validate
  if (!checked.ok) {
    // => gate failed: the effect never runs
    return { ok: false, issue: checked.issue }; // => gate error out
  } // => gate passed: fall through to the effect
  const result = discountEffect(checked.pct); // => Effect's job: the fallible logic
  if (!result.ok) {
    // => effect failed: its error becomes the reply
    return { ok: false, issue: result.error }; // => effect error out
  } // => effect succeeded: fall through
  return { ok: true, rate: result.rate }; // => the multiplier out
}
function main(): void {
  // => entry point; a string is gated, an over-cap number fails the effect, 40 succeeds
  // => the string from the wire stops at the gate: no cast, no coercion
  const gated = applyDiscount("40"); // => hostile wire input
  if (!gated.ok) {
    // => the gate names the expected shape
    console.log("gated: " + gated.issue); // => fixed: gate rejects non-numbers
  } // => gated done
  // => a valid number passes the gate and the effect computes the rate
  const valid = applyDiscount(40); // => honest numeric input
  if (valid.ok) {
    // => narrow before reading the rate
    console.log("valid: rate=" + String(valid.rate)); // => gate plus effect agree
  } // => valid done
}
main(); // => run once; a throw exits nonzero
