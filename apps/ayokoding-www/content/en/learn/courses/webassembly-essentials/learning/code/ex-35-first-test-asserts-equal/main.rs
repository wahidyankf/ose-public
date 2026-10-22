// Example 35: First Test Asserts Equal.
//
// Tests live beside the code in #[cfg(test)] modules and run with the
// same toolchain. assert_eq compares left (computed) against right
// (expected), and a mismatch prints both sides with their Debug shapes.
// The harness builds this file with rustc --test and runs the resulting
// test binary under the same WASI runtime as every example.
// => #[test] marks the function: no registry, no naming convention needed
// => left computes, right states: mismatch prints "left, right" to debug

// double is the unit under test: the simplest function worth pinning.
// => one-line pure function: the test below pins its whole behavior
fn double(value: i32) -> i32 {
    value * 2
}

// => cfg(test) compiles this module only for test builds: release binaries
// => carry no test code, and normal builds never see the test helpers
#[cfg(test)]
mod tests {
    // => super::* imports the unit under test: double is in scope below
    use super::*;

    // => the first test: doubling 21 is 42, the oldest joke in computing
    #[test]
    fn doubles_a_positive_number() {
        // => left computes, right states: mismatch prints both sides
        assert_eq!(double(21), 42);
    }

    // => the second test: doubling zero stays zero, no special case needed
    #[test]
    fn doubles_zero_to_zero() {
        // => zero is the boundary that hand-rolled code loves to fumble
        assert_eq!(double(0), 0);
    }

    // => the third test: negatives double away from zero, sign preserved
    // => three tests pin three signs: positive, zero, and negative inputs
    #[test]
    fn doubles_a_negative_number() {
        // => -21 * 2 is -42: the sign rides along with the magnitude
        assert_eq!(double(-21), -42);
    }
}

fn main() {
    // => the binary still runs standalone: tests and main share the file
    println!("double 21 = {}", double(21));
}
