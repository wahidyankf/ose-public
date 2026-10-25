// Kata 02 After: the test pins the total before the run trusts it.
// => Three checks execute in `main`: exact sum, empty corner, pair sum.
// => `assert_eq!` fails loudly on mismatch: silence means every check held.
// => The transcript confirms the count: three checks, all green.
// => Real suites live in `#[cfg(test)]` modules; this kata runs them inline.
fn total(dues: &[i32]) -> i32 {
    // => the same plain sum, now guarded
    dues.iter().sum() // => unchanged logic: the tests are the whole change
}
// => `check` names each fact: input, hand total, and verdict in one line.
fn check(name: &str, got: i32, want: i32) -> bool {
    // => true when the fact holds
    let holds = got == want; // => the fact under test
    println!("{}: {} == {} -> {}", name, got, want, holds); // => names the verdict
    holds // => callers count the green checks
}
fn main() {
    // => three fixed facts: the hand totals computed before writing the test.
    let mut passed = 0; // => counts the green checks below
    if check("three dues", total(&[50, 75, 25]), 150) {
        passed += 1;
    } // => 150 by hand
    if check("empty", total(&[]), 0) {
        passed += 1;
    } // => empty sums to zero
    if check("pair", total(&[50, 75]), 125) {
        passed += 1;
    } // => 125 by hand
    println!("passed: {}/3", passed); // => Output: passed: 3/3
}
