// Example 39: Doc Examples Are Tested Too.
//
// A /// example that does not compile is a lie with formatting: rustdoc
// treats fenced code in doc comments as tests, so the example in the docs
// runs in CI like every #[test]. The suite below mirrors the doc example
// assertion-for-assertion, because the doc is the first test most readers
// ever meet, and it must pass exactly like the suite it introduces.
// => doc examples compile and run: rustdoc executes every ``` block
// => mirror the doc in #[test]: two passing copies beat one stale page

/// Halves an even number, refusing odd inputs with a readable message.
///
/// ```
/// // The doc example is a test: rustdoc compiles and runs this block.
/// let half = example_39::half(8).unwrap();
/// assert_eq!(half, 4);
/// ```
// NOTE: the doc block above names its crate for rustdoc's library runs;
// the harness compiles this file as a binary, so the lesson marks the
// crate path an illustration where it quotes it, and the suite below is
// the copy this unit actually executes under the WASI runtime.
// => mirror, don't duplicate logic: both copies call the same half below
// => the suite is the runnable copy: its transcript is the committed golden

// half refuses odd inputs exactly like Example 9's lesson teaches.
// => Result keeps the refusal typed: the doc and the suite share the type
// => one definition serves docs, suite, and binary: no copy-paste drift
fn half(even: i32) -> Result<i32, String> {
    // => the oddness guard names the input it cannot serve, then leaves
    if even % 2 != 0 {
        return Err(format!("{even} is odd, cannot halve exactly"));
    }
    Ok(even / 2)
}

// => cfg(test) mirrors the doc example: the same call, the same assertion
#[cfg(test)]
mod tests {
    // => super::* imports half: the mirror tests the real function below
    use super::*;

    // => the doc's assertion, runnable: half(8) is Ok(4) here as there
    #[test]
    fn doc_example_halves_eight() {
        // => unwrap is safe: 8 is even by the literal the test states
        assert_eq!(half(8).unwrap(), 4);
    }

    // => the doc's shadow case: odd inputs refuse, and the suite pins it
    #[test]
    fn doc_shadow_case_refuses_odd() {
        // => the refusal is behavior: the doc promises it, the test keeps it
        assert!(half(7).is_err());
    }
}

fn main() {
    // => the binary demonstrates both arms the suite pins above
    println!("half(8) = {:?}", half(8));
    println!("half(7) = {:?}", half(7));
}
