// Example 68: Eprintln Marks the Loud Boundary.
// => `eprintln!` writes diagnostics: operators read stderr, pipes read stdout.
// => Fix stdout as the report contract: stderr stays human, never parsed.
// => Missing inputs exit nonzero: silence would masquerade as an empty report.
// => This unit runs the happy path: stdout carries the fixed settlement.
// => The loud shape lives in the capstone: missing fixture, stderr, exit 1.
use std::fmt::Write; // => `write!` builds the report string in memory
                     // => `settle_report` renders fixed dues: pure rendering, no I/O inside.
fn settle_report(dues: &[(&str, i32)]) -> String {
    // => borrows the fixed pairs
    let mut out = String::new(); // => the report grows line by line
    let mut total = 0; // => the running total across all pairs
    for (member, amount) in dues {
        // => each pair renders one line
        writeln!(out, "{}: {}", member, amount).expect("string never fails"); // => infallible write
        total += amount; // => the total grows with the report
    }
    writeln!(out, "total: {}", total).expect("string never fails"); // => the closing line
    out // => the whole report as one owned string
}
fn main() {
    // => fixed dues settle into a fixed three-line report on stdout.
    let report = settle_report(&[("sari", 50), ("budi", 75)]); // => the happy path
    print!("{}", report); // => the three-line report: two dues plus total 125
}
