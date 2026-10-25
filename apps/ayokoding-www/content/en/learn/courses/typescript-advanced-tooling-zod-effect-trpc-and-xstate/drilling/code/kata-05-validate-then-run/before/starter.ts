// => Kata 5 starter: the discount effect runs on unvalidated input.
// => Task: parse first with a schema gate, then run the effect on trusted input.
function discountEffect(pct: number): { ok: true; rate: number } | { ok: false; error: string } {
  // => the effect: applies the discount rate or fails when overdrawn
  if (pct > 50) {
    // => business rule: never discount more than half
    return { ok: false, error: "discount capped at 50" }; // => typed error value
  } // => within cap: fall through
  return { ok: true, rate: 1 - pct / 100 }; // => the multiplier
}
function main(): void {
  // => entry point; a string input reaches the numeric effect unchecked
  // => the wire hands over a string and the effect trusts it blindly
  const wire: unknown = "40"; // => query params arrive as strings
  const rate = discountEffect(wire as number); // => BUG: cast instead of parse
  if (rate.ok) {
    // => the arithmetic silently coerces: "40" behaves like 40 until it does not
    console.log("starter: rate=" + String(rate.rate) + " (unvalidated cast)"); // => starter prints a rate from a lie
  } // => starter done
  // => the task: a schema gate so only real numbers reach the effect
  console.log("wanted: gate rejects non-numbers"); // => target after the fix
}
main(); // => run once; a throw exits nonzero
