// Example 43: Should Panic Documents the Contract.
// => `#[should_panic]` passes when the test panics: refusal is the verdict.
// => `expected` pins the message: the panic must say the right thing.
// => Panics mark caller bugs, not runtime failures: inputs a caller must never send.
// => The file has no `main`: the test harness provides the entry point.
fn settle(amount: i32) -> i32 {
    // => dues must be strictly positive here
    if amount <= 0 {
        // => the contract boundary: zero and below refused
        panic!("negative refused: {}", amount); // => loud refusal, names the input
    }
    amount // => valid dues pass straight through
}
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: refusal pinned plus acceptance pinned
    use super::*; // => `settle` is in scope
    #[test]
    // => refusal is the expected outcome for negative input
    // => `expected` is a substring match: the exact amount may still vary.
    #[should_panic(expected = "negative refused")] // => the message must match
    fn refuses_negative_dues() {
        // => the contract, enforced by the test
        settle(-5); // => panics with the pinned message: test passes
    }
    #[test] // => valid dues still settle: the panic is narrow, not total
    fn accepts_positive_dues() {
        // => the other side of the boundary
        assert_eq!(settle(50), 50); // => clean input, clean output
    }
}
