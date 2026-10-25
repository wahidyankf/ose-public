// Example 13: Custom Error Enum.
// => An enum names every failure mode: callers match variants, not strings.
// => `Display` renders the message; `Error` plugs the type into `?` chains.
use std::fmt; // => `Display` and `Formatter` live here
#[derive(Debug)] // => `Debug` for the test-style `{:?}` print below
enum LedgerError {
    // => every way settling can fail, in one type
    BadLine(String),   // => the line has no colon at all
    BadAmount(String), // => the amount after the colon will not parse
    Negative(String),  // => dues only grow: a minus sign is refused
}
// => `Display` decides what operators read; keep each arm to one line.
impl fmt::Display for LedgerError {
    // => the human message per variant
    fn fmt(&self, out: &mut fmt::Formatter<'_>) -> fmt::Result {
        // => standard shape
        match self {
            // => every variant needs its own message
            LedgerError::BadLine(l) => write!(out, "bad line: {}", l), // => names the line
            LedgerError::BadAmount(l) => write!(out, "bad amount: {}", l), // => names the line
            LedgerError::Negative(l) => write!(out, "negative refused: {}", l), // => names the line
        }
    }
}
// => `Error` needs `Debug` plus `Display`: both exist, so this is one line.
// => The empty body is complete: the trait has no required methods left.
impl std::error::Error for LedgerError {} // => plugs into `?` and `Box<dyn Error>`
                                          // => The parser now returns the enum: callers learn the mode, not just text.
fn parse_line(line: &str) -> Result<(&str, i32), LedgerError> {
    // => typed failures
    let (member, raw) = line // => same split as the wrapping example
        .split_once(':') // => `None` when the colon is missing
        .ok_or_else(|| LedgerError::BadLine(line.to_string()))?; // => variant one
    let amount = raw // => the text after the colon
        .parse::<i32>() // => still the stdlib parser underneath
        .map_err(|_| LedgerError::BadAmount(line.to_string()))?; // => variant two
    if amount < 0 {
        // => the domain rule: dues never go negative
        return Err(LedgerError::Negative(line.to_string())); // => variant three
    }
    Ok((member, amount)) // => a clean line survives all three checks
}
fn main() {
    // => three fixed lines exercise all three variants plus success.
    // => `unwrap_err` is test-only shorthand: it would panic in production code.
    println!("{:?}", parse_line("sari:50").unwrap()); // => Output: ("sari", 50)
    println!("{}", parse_line("oops").unwrap_err()); // => Output: bad line: oops
    println!("{}", parse_line("sari:xyz").unwrap_err()); // => Output: bad amount: sari:xyz
    println!("{}", parse_line("sari:-5").unwrap_err()); // => Output: negative refused: sari:-5
}
