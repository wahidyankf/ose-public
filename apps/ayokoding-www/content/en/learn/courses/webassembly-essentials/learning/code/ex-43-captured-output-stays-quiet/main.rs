// Example 43: Captured Output Stays Quiet.
//
// Passing tests print nothing by default: the harness captures their
// stdout so the transcript shows results, not chatter. A second run with
// -- --nocapture releases the capture for the debugging session that
// needs to see inside, then the flag comes off and the suite returns to
// quiet green. Both runs are committed: quiet proves the default, loud
// proves the escape hatch, and both stay byte-identical run after run.
// => capture is the default: println! in tests hides unless they fail
// => nocapture is a session flag: debug with it, commit the quiet suite

// trace_add adds while narrating: the println helps humans, not goldens.
// => the narration prints only under -- --nocapture or on test failure
// => the return value is the contract: narration never affects the sum
fn trace_add(left: i32, right: i32) -> i32 {
    // => captured by default: this line hides on every passing run below
    println!("adding {left} + {right}");
    left + right
}

// => cfg(test) calls the narrating helper: capture keeps the suite quiet
#[cfg(test)]
mod tests {
    // => super::* imports trace_add: the suite tests the narrating sum
    use super::*;

    // => the contract test: 20 + 22 is 42, narration captured away
    #[test]
    fn adds_with_quiet_narration() {
        // => the assertion pins the sum: the println above stays hidden
        assert_eq!(trace_add(20, 22), 42);
    }

    // => the boundary test: zeros add silently, narration captured too
    #[test]
    fn adds_zeros_quietly() {
        // => 0 + 0 is 0: the narration hides exactly like the first test
        assert_eq!(trace_add(0, 0), 0);
    }
}

fn main() {
    // => the binary narrates openly: no capture applies outside tests
    println!("20 + 22 = {}", trace_add(20, 22));
}
