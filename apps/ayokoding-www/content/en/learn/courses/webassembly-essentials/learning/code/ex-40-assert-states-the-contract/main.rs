// Example 40: Assert States the Contract.
//
// Some inputs must never arrive: assert! states that contract in the code,
// and violating it aborts the module with the contract message attached.
// On this runtime panics always abort (WebAssembly has no unwinding here),
// so there is no catching a violation: the suite pins the valid side, and
// the lesson shows the abort transcript as a marked illustration. On
// unwinding targets the same contract would wear #[should_panic]; here the
// abort is the enforcement, loud and immediate.
// => assert documents intent: the message names the violated contract
// => abort enforces it: violations trap the module, never return Err

// parse_positive refuses zero and negatives for counts that must be counts.
// => u32 input already excludes negatives: zero is the remaining refusal
// => the panic message names the contract: "counts start at 1"
fn parse_positive(text: &str) -> u32 {
    // => digits first: non-numbers panic with the parse message attached
    let value: u32 = text.parse().expect("count must be digits");
    // => zero is unusable as a count: assert states the contract loudly
    assert!(value > 0, "counts start at 1, got {value}");
    value
}

// => cfg(test) pins the valid side: contracts hold for the inputs below
#[cfg(test)]
mod tests {
    // => super::* imports parse_positive: the suite tests the real guard
    use super::*;

    // => the happy path: "3" parses and passes the positivity guard
    #[test]
    fn positive_count_passes() {
        // => 3 is valid: the assertion pins the ordinary accepted case
        assert_eq!(parse_positive("3"), 3);
    }

    // => the boundary: "1" is the smallest count the contract accepts
    #[test]
    fn one_is_the_smallest_count() {
        // => 1 passes the guard by exactly zero margin: the edge is pinned
        assert_eq!(parse_positive("1"), 1);
    }
}

fn main() {
    // => the binary shows the accepted case the suite pins above
    println!("count: {}", parse_positive("3"));
}
