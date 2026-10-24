// Example 69: Examples Double as Tests.
// => One table of cases serves the docs and the assertions together.
// => `main` runs every documented case: the transcript proves the docs.
// => Adding a documented case means adding a row: docs and tests stay one.
// => Silent asserts plus printed confirmations: failures panic, success shows.
// => Three fixed dues cover above, below, and exactly on the waiver line.
const WAIVER_LINE: i32 = 100; // => the documented threshold, one place
                              // => `waive` halves dues above the line: the single documented rule.
fn waive(amount: i32) -> i32 {
    // => pure: same input, same output
    if amount > WAIVER_LINE {
        // => strictly above halves
        amount / 2 // => integer division, rounds down
    } else {
        amount // => on or below settles whole
    }
}
fn main() {
    // => the documented table: input, expected, one row per case.
    let cases = [(150, 75), (50, 50), (100, 100)]; // => above, below, on the line
    for (input, want) in cases {
        // => the doc table drives the checks
        assert_eq!(waive(input), want); // => the suite half: silent on green
        println!("{} -> {}", input, waive(input)); // => the doc half: visible always
    }
}
