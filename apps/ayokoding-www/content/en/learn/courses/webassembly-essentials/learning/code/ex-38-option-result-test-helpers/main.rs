// Example 38: Option and Result Test Helpers.
//
// Tests may do what library code must not: unwrap the expected, expect a
// message on the impossible. Test-only unwrap keeps suites readable while
// the shipped paths keep returning Result, and expect documents the exact
// shape a passing test requires its fixture to have.
// => unwrap in tests is a verdict: "this fixture must be Some by setup"
// => expect adds the message: the failure names the broken assumption

// find_nickname looks up the fixed directory from Example 3's lesson.
// => the suite unwraps the hits: the fixture promises these names exist
// => production callers still match: unwrap never leaves the test module
fn find_nickname(name: &str) -> Option<&'static str> {
    // => 'static answers: the directory below lives for the whole run
    match name {
        // => string patterns dispatch: two names hit, the rest miss
        "sari" => Some("S"),
        // => literals match by value: no allocation, no hashing
        "budi" => Some("B"),
        // => single letters abbreviate: the transcript stays narrow
        _ => None,
        // => the wildcard closes the directory: unknown names miss
    }
}

// parse_score parses digits or refuses, like Example 20's decimal arm.
// => parse errors stay typed here: the suite matches the Err arm directly
fn parse_score(text: &str) -> Result<u32, String> {
    // => String errors quote: the refusal carries the bad text along
    text.parse::<u32>()
        .map_err(|_| format!("{text:?} is not a score"))
    // => one expression body: parse, then wrap the failure, no braces
}

// => cfg(test) demonstrates the helpers: unwrap and expect in their place
#[cfg(test)]
mod tests {
    // => five tests, five helpers: unwrap, expect, none, ok, err
    // => super::* imports both units under test in a single line
    use super::*;

    // => unwrap on a hit: the fixture guarantees "sari" is present
    #[test]
    fn known_name_unwraps() {
        // => the simplest helper: unwrap asserts presence in one call
        // => the unwrap is the verdict: absence would mean broken fixture
        assert_eq!(find_nickname("sari").unwrap(), "S");
    }

    // => expect on a hit with a message: the failure names the assumption
    #[test]
    fn known_name_expects_with_message() {
        // => expect adds context: the message names the broken setup
        // => the message prints on failure: "directory must hold budi"
        assert_eq!(
            find_nickname("budi").expect("directory must hold budi"),
            // => the message quotes the assumption: budi must be listed
            "B"
        );
    }

    // => is_none on a miss: absence is asserted, never unwrapped, by design
    #[test]
    fn unknown_name_is_none() {
        // => absence gets its own test: misses are behavior too
        // => misses assert as None: no unwrap touches a possibly-absent value
        assert_eq!(find_nickname("citra"), None);
    }

    // => unwrap on an Ok parse: "91" parses, so the suite says so flatly
    #[test]
    fn valid_score_unwraps() {
        // => digits parse: the happy path needs no message
        // => the happy path unwraps: digits are guaranteed by the literal
        assert_eq!(parse_score("91").unwrap(), 91);
    }

    // => is_err on a refusal: "9x" must fail, and the suite pins that fact
    #[test]
    fn invalid_score_is_err() {
        // => is_err pins the refusal: digit soup never becomes a score
        // => the refusal is the behavior: digit soup never parses to a score
        assert!(parse_score("9x").is_err());
    }
}

fn main() {
    // => the demo prints Debug: the hit and the miss, side by side
    // => the binary shows the same lookups the suite pins above
    println!("sari -> {:?}", find_nickname("sari"));
    // => the hit prints first: Some("S") before the miss
    println!("citra -> {:?}", find_nickname("citra"));
    // => the miss prints second: None is data, not a failure here
}
