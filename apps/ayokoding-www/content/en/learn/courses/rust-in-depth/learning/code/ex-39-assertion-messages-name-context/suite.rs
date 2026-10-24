// Example 39: Assertion Messages Name Context.
// => `assert!` and `assert_eq!` take context after the condition.
// => Name the input under test: failures then point at their own row.
// => All three pass here; the messages wait for the day one does not.
// => The file has no `main`: the test harness provides the entry point.
fn parse_amount(raw: &str) -> Option<i32> {
    // => the parser from the table test
    let trimmed = raw.trim(); // => padding never decides validity
    if trimmed.is_empty() {
        // => blank is missing, not zero
        return None; // => early return keeps the parse flat
    }
    trimmed.parse::<i32>().ok() // => digits parse; junk becomes `None`
}
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: three lines, each with its own message
    use super::*; // => `parse_amount` is in scope
    #[test] // => each assert names the line it checks
    fn messages_name_their_lines() {
        // => context travels with the check
        assert_eq!(parse_amount("50"), Some(50), "clean digits line"); // => names the row
        assert_eq!(parse_amount(" 75 "), Some(75), "padded line"); // => names the row
        assert_eq!(parse_amount("xyz"), None, "junk line"); // => names the row
    }
    #[test] // => boolean asserts carry messages the same way
            // => Format args after the message render the values into the context.
    fn totals_stay_positive() {
        // => the domain rule as a test
        assert!(
            parse_amount("50").unwrap_or(0) > 0,
            "dues stay positive: {}",
            50
        ); // => names the value
    }
}
