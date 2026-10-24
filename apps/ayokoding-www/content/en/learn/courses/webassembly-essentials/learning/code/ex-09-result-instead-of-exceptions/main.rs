// Example 9: Result Instead of Exceptions.
//
// Recoverable failure is a value: Result carries either the answer or
// the reason, and the caller matches both arms at the call site.
// Nothing unwinds across layers, so a Wasm trap always means a bug,
// never a mishandled input.
// => Ok holds the answer; Err holds a reason the caller can read
// => matching at the call site keeps the failure next to its cause

// half refuses odd inputs: halving an odd number loses information.
// => Result<i32, String> makes the refusal part of the signature
// => the signature is the documentation: no hidden failure modes
fn half(even: i32) -> Result<i32, String> {
    // => the guard names the exact input this function cannot serve
    if even % 2 != 0 {
        // => Err carries a readable reason, not a code to look up
        return Err(format!("{even} is odd, cannot halve exactly"));
    }
    // => the happy path divides: even inputs always divide cleanly
    Ok(even / 2)
}

fn main() {
    // => match the refusal first: odd input prints its reason, exit stays 0
    match half(7) {
        // => Ok arm is unreachable: 7 trips the oddness guard above
        Ok(value) => println!("half of 7: {value}"),
        // => Err arm prints the reason: the failure is handled, not thrown
        Err(reason) => println!("refused: {reason}"),
    }
    // => match the success: even input divides and prints its half
    match half(8) {
        // => Ok arm prints 4: the only reachable arm for even input
        Ok(value) => println!("half of 8: {value}"),
        // => Err arm is unreachable: even inputs never hit the guard
        Err(reason) => println!("refused: {reason}"),
    }
}
