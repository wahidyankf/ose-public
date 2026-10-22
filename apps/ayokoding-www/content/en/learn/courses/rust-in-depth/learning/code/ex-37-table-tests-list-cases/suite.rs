// Example 37: Table Tests List Cases.
// => One test loops over rows: each row is an input with its verdict.
// => Adding a case means adding a row, never touching the assertion.
// => `{:?}` on the row would identify failures; all rows pass here.
// => Five rows below: clean, padded, empty, junk, and negative.
// => The file has no `main`: the test harness provides the entry point.
fn parse_amount(raw: &str) -> Option<i32> {
    // => `None` rejects blank and junk
    let trimmed = raw.trim(); // => padding never decides validity
    if trimmed.is_empty() {
        // => the blank corner, checked first
        return None; // => empty is not zero: it is missing
    }
    trimmed.parse::<i32>().ok() // => digits parse; junk becomes `None`
}
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: one looping test over five rows
    use super::*; // => `parse_amount` is in scope
    #[test] // => the table test: rows are data, the loop is the check
    fn parses_case_table() {
        // => five fixed rows, each with its verdict
        let cases: [(&str, Option<i32>); 5] = [
            // => input, expected, side by side
            ("50", Some(50)),   // => clean digits
            (" 75 ", Some(75)), // => padding trims away
            ("", None),         // => blank is missing, not zero
            ("xyz", None),      // => junk never parses
            ("-5", Some(-5)),   // => negatives parse: the caller refuses them
        ];
        for (raw, want) in cases {
            // => every row takes the same assertion
            // => One assertion, five verdicts: the loop is the whole test body.
            assert_eq!(parse_amount(raw), want); // => row verdict, checked
        }
    }
}
