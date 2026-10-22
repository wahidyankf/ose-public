// Example 19: Split, Trim, Parse Pipeline.
// => `split_once` divides a line at the first separator, no regex needed.
// => `trim` removes surrounding whitespace before the value is parsed.
// => The pipeline shape matches the line grammar: name, colon, amount.
fn parse_pair(line: &str) -> Option<(&str, i32)> {
    // => `None` skips bad lines
    // => `?` on `Option` returns `None` early: the error-handling habit reused.
    let (member, raw) = line.split_once(':')?; // => shape check first
    let amount = raw.trim().parse::<i32>().ok()?; // => noise off, then parse
    Some((member.trim(), amount)) // => clean pair for the caller
}
fn main() {
    // => fixed lines: two parse, one has a broken amount, one lacks a colon.
    let lines = ["sari: 50", "oops", "budi: xyz", "citra: 25"]; // => four shapes
    for line in lines {
        // => each line takes the same three stages
        match parse_pair(line) {
            // => `Some` prints, `None` reports the skip
            Some((member, amount)) => println!("{} owes {}", member, amount), // => two hits
            None => println!("skip: {}", line), // => oops and budi: xyz
        }
    }
}
