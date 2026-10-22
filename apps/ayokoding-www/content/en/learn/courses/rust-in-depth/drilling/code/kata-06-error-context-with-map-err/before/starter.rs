// Kata 06 Before: a bare parse error never names its ledger line.
// => `ParseIntError` says `invalid digit`: true of ten thousand lines.
// => The task: wrap the failure where the line is known, naming the input.
// => The verdict for "sari:xyz" must name sari's line, not just the digits.
use std::num::ParseIntError; // => the bare low-level error, context-free
fn amount_bare(raw: &str) -> Result<i32, ParseIntError> {
    // => no context attached
    raw.trim().parse::<i32>() // => fails with `invalid digit found in string`
}
fn main() {
    // => the unhelpful verdict the rewrite must improve upon.
    println!("{:?}", amount_bare("xyz")); // => names the digits, not the line
}
