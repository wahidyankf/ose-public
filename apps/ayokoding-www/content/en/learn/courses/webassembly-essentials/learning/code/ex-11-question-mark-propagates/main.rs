// Example 11: Question Mark Propagates.
//
// The ? operator is early-return shorthand: on Err it returns the error
// to the caller, on Ok it unwraps the value inline. A three-step pipeline
// becomes three lines with no match arms, yet every failure still exits
// through the function's own Result.
// => ? after a call means "succeed here or leave with the error"
// => the function needs a Result return: ? can only exit through one

// parse_port and check_range model a setup chain, each fallible in turn.
// => parse_port refuses non-numbers with a readable message, never a trap
// => check_range refuses privileged ports WASI could never bind anyway
fn parse_port(text: &str) -> Result<u16, String> {
    // => parse failure becomes a readable refusal via map_err, not a panic
    text.parse::<u16>()
        .map_err(|_| format!("{text:?} is not a number"))
}

// check_range refuses privileged ports, which need rights WASI never has.
// => the guard names the policy: ports below 1024 stay out of reach
// => returning the port on success lets ? thread the value onward
fn check_range(port: u16) -> Result<u16, String> {
    // => 1024 is the first unprivileged port: the boundary is inclusive
    if port < 1024 {
        return Err(format!("port {port} is privileged, pick 1024 or above"));
    }
    Ok(port)
}

// describe runs the whole chain: parse, then check, then report.
// => two ? in a row: the first Err exits before the second stage runs
// => the single Ok line at the end serves only fully validated input
fn describe(text: &str) -> Result<String, String> {
    // => ? unwraps the port or returns the parse refusal immediately
    let port = parse_port(text)?;
    // => ? unwraps the checked port or returns the policy refusal instead
    let open = check_range(port)?;
    // => both stages passed: the description carries the validated port
    Ok(format!("serving on port {open}"))
}

fn main() {
    // => each input below exercises a different exit of the same chain
    for text in ["abc", "80", "3101"] {
        // => one match serves the whole pipeline: Ok prints, Err explains
        match describe(text) {
            // => reachable only when parse and check both succeed
            Ok(line) => println!("{text}: {line}"),
            // => reachable with the exact refusal of the failing stage
            Err(reason) => println!("{text}: refused: {reason}"),
        }
    }
}
